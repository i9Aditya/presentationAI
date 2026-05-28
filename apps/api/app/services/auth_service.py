import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.schemas.auth import AuthRequest, AuthResponse, GoogleAuthRequest, LoginRequest, UserProfile

security = HTTPBearer(auto_error=False)

TEMP_EMAIL_DOMAINS = {
    "10minutemail.com", "10minutemail.net", "20minutemail.com", "guerrillamail.com",
    "guerrillamail.net", "guerrillamail.org", "mailinator.com", "maildrop.cc",
    "tempmail.com", "temp-mail.org", "throwawaymail.com", "yopmail.com",
    "yopmail.fr", "sharklasers.com", "getairmail.com", "trashmail.com",
    "dispostable.com", "fakeinbox.com", "mintemail.com", "mohmal.com",
    "emailondeck.com", "mailnesia.com", "tempinbox.com", "spamgourmet.com"
}

FREE_DOMAINS_ALLOWED = {"gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me", "protonmail.com"}
PLAN_LIMITS = {"free": 5, "pro": 100, "business": 500, "enterprise": 5000}


class AuthService:
    def __init__(self) -> None:
        self.data_path = Path("data/users.json")
        self.data_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.data_path.exists():
            self._write({"users": [], "sessions": {}})

    def signup(self, request: AuthRequest) -> AuthResponse:
        email = request.email.lower().strip()
        self._validate_email(email)
        db = self._read()
        if self._find_user(db, email):
            raise HTTPException(status_code=409, detail="Account already exists. Please log in.")
        user = {
            "id": f"usr_{uuid4().hex[:12]}",
            "email": email,
            "name": request.name,
            "password_hash": self._hash_password(request.password),
            "plan": "free",
            "role": "user",
            "monthly_used": 0,
            "billing_month": self._month_key(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        db["users"].append(user)
        token = self._create_session(db, user["id"])
        self._write(db)
        return AuthResponse(token=token, user=self._profile(user))

    def login(self, request: LoginRequest) -> AuthResponse:
        db = self._read()
        user = self._find_user(db, request.email.lower().strip())
        if not user or not user.get("password_hash") or not self._verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        token = self._create_session(db, user["id"])
        self._write(db)
        return AuthResponse(token=token, user=self._profile(self._rollover_user_month(user)))

    def google_login(self, request: GoogleAuthRequest) -> AuthResponse:
        email = request.email.lower().strip()
        self._validate_email(email)
        db = self._read()
        user = self._find_user(db, email)
        if not user:
            user = {
                "id": f"usr_{uuid4().hex[:12]}",
                "email": email,
                "name": request.name or email.split("@")[0],
                "password_hash": None,
                "google_id": request.google_id,
                "picture": request.picture,
                "plan": "free",
                "role": "user",
                "monthly_used": 0,
                "billing_month": self._month_key(),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            db["users"].append(user)
        else:
            if request.name and not user.get("name"):
                user["name"] = request.name
            if request.google_id:
                user["google_id"] = request.google_id
            if request.picture:
                user["picture"] = request.picture
        token = self._create_session(db, user["id"])
        self._write(db)
        return AuthResponse(token=token, user=self._profile(self._rollover_user_month(user)))

    def current_user(self, credentials: HTTPAuthorizationCredentials | None) -> dict:
        if not credentials:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login required to generate documents.")
        db = self._read()
        user_id = db.get("sessions", {}).get(credentials.credentials)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please log in again.")
        user = self._find_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found.")
        self._rollover_user_month(user)
        self._write(db)
        return user

    def consume_generation(self, user: dict) -> UserProfile:
        db = self._read()
        stored = self._find_user_by_id(db, user["id"])
        if not stored:
            raise HTTPException(status_code=401, detail="Account not found.")
        self._rollover_user_month(stored)
        limit = PLAN_LIMITS.get(stored.get("plan", "free"), PLAN_LIMITS["free"])
        if stored.get("monthly_used", 0) >= limit:
            raise HTTPException(status_code=402, detail="Monthly generation limit reached. Upgrade your subscription to continue.")
        stored["monthly_used"] = stored.get("monthly_used", 0) + 1
        self._write(db)
        return self._profile(stored)

    def me(self, user: dict) -> UserProfile:
        return self._profile(self._rollover_user_month(user))

    def _validate_email(self, email: str) -> None:
        domain = email.split("@")[-1].lower()
        local = email.split("@")[0].lower()
        if domain in TEMP_EMAIL_DOMAINS:
            raise HTTPException(status_code=400, detail="Temporary email addresses are not allowed.")
        suspicious_words = ["temp", "trash", "throw", "disposable", "fake", "mailinator", "guerrilla", "yopmail"]
        if any(word in domain for word in suspicious_words):
            raise HTTPException(status_code=400, detail="Disposable-looking email domains are not allowed.")
        if len(local) < 3 or local.startswith("test") and domain not in FREE_DOMAINS_ALLOWED:
            raise HTTPException(status_code=400, detail="Please use a real personal, academic, or business email.")

    def _hash_password(self, password: str) -> str:
        salt = secrets.token_bytes(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return base64.b64encode(salt + digest).decode("ascii")

    def _verify_password(self, password: str, stored: str) -> bool:
        raw = base64.b64decode(stored.encode("ascii"))
        salt, digest = raw[:16], raw[16:]
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return hmac.compare_digest(candidate, digest)

    def _create_session(self, db: dict, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        db.setdefault("sessions", {})[token] = user_id
        return token

    def _profile(self, user: dict) -> UserProfile:
        plan = user.get("plan", "free")
        return UserProfile(
            id=user["id"],
            email=user["email"],
            name=user.get("name"),
            plan=plan,
            monthly_limit=PLAN_LIMITS.get(plan, PLAN_LIMITS["free"]),
            monthly_used=user.get("monthly_used", 0),
            role=user.get("role", "user"),
        )

    def _rollover_user_month(self, user: dict) -> dict:
        current = self._month_key()
        if user.get("billing_month") != current:
            user["billing_month"] = current
            user["monthly_used"] = 0
        return user

    def _month_key(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m")

    def _find_user(self, db: dict, email: str) -> dict | None:
        return next((user for user in db.get("users", []) if user.get("email") == email), None)

    def _find_user_by_id(self, db: dict, user_id: str) -> dict | None:
        return next((user for user in db.get("users", []) if user.get("id") == user_id), None)

    def _read(self) -> dict:
        return json.loads(self.data_path.read_text(encoding="utf-8"))

    def _write(self, payload: dict) -> None:
        self.data_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


auth_service = AuthService()


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict:
    return auth_service.current_user(credentials)
