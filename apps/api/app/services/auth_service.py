import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from uuid import uuid4
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.schemas.auth import AuthRequest, AuthResponse, GoogleAuthRequest, LoginRequest, UserProfile
from app.core.config import settings

security = HTTPBearer(auto_error=False)

PLAN_LIMITS = {"free": 5, "pro": 100, "business": 500, "enterprise": 5000}

class AuthService:
    def __init__(self) -> None:
        self.db_url = settings.database_url

    def _get_conn(self):
        try:
            # We must handle passwords with '@' or other special chars.
            # Instead of trying to parse the URL string manually, we'll let psycopg2 handle it, 
            # BUT we need to ensure the user hasn't provided a malformed raw string.
            # If the URL is provided as a standard string, psycopg2 handles it natively in modern versions.
            url = self.db_url
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            
            if "sslmode" not in url:
                separator = "&" if "?" in url else "?"
                url += f"{separator}sslmode=require"

            # If the user put '@' in their password without URL encoding it, 
            # standard parsers will break (thinking the password ends at the first @).
            # We will try to parse and fix it if it's broken.
            import urllib.parse
            parsed = urllib.parse.urlparse(url)
            
            # If the hostname looks like it swallowed part of the password (e.g. "2003AI@db.supabase.co")
            if parsed.hostname and '@' in parsed.hostname:
                print("DEBUG: Detected malformed connection string (unencoded '@' in password). Attempting fix.")
                # We need to extract the raw string and encode the password part.
                # Format is postgresql://user:password@host:port/dbname
                # We can do a rudimentary split from the right to find the true host
                try:
                    scheme, rest = url.split("://", 1)
                    credentials, host_port_db = rest.rsplit("@", 1)
                    user, raw_password = credentials.split(":", 1)
                    encoded_password = urllib.parse.quote_plus(raw_password)
                    url = f"{scheme}://{user}:{encoded_password}@{host_port_db}"
                    print(f"DEBUG: Fixed URL format.")
                except Exception as e:
                    print(f"DEBUG: URL fix attempt failed: {e}")

            return psycopg2.connect(url, cursor_factory=RealDictCursor)
        except Exception as e:
            print(f"❌ DATABASE CONNECTION ERROR: {type(e).__name__}: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Database connection failed. Check logs for error: {type(e).__name__}"
            )

    def signup(self, request: AuthRequest) -> AuthResponse:
        email = request.email.lower().strip()
        conn = self._get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                conn.close()
                raise HTTPException(status_code=409, detail="Account already exists.")
            
            user_id = f"usr_{uuid4().hex[:12]}"
            cur.execute(
                "INSERT INTO users (id, email, name, password_hash, plan, role) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                (user_id, email, request.name, self._hash_password(request.password), "free", "user")
            )
            user = cur.fetchone()
            token = self._create_session(cur, user["id"])
            conn.commit()
            conn.close()
            return AuthResponse(token=token, user=self._profile(user))

    def login(self, request: LoginRequest) -> AuthResponse:
        conn = self._get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (request.email.lower().strip(),))
            user = cur.fetchone()
            if not user or not user.get("password_hash") or not self._verify_password(request.password, user["password_hash"]):
                conn.close()
                raise HTTPException(status_code=401, detail="Invalid email or password.")
            
            token = self._create_session(cur, user["id"])
            conn.commit()
            conn.close()
            return AuthResponse(token=token, user=self._profile(user))

    def google_login(self, request: GoogleAuthRequest) -> AuthResponse:
        email = request.email.lower().strip()
        conn = self._get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
            if not user:
                user_id = f"usr_{uuid4().hex[:12]}"
                cur.execute(
                    "INSERT INTO users (id, email, name, google_id, picture, plan, role) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *",
                    (user_id, email, request.name, request.google_id, request.picture, "free", "user")
                )
                user = cur.fetchone()
            
            token = self._create_session(cur, user["id"])
            conn.commit()
            conn.close()
            return AuthResponse(token=token, user=self._profile(user))

    def current_user(self, credentials: HTTPAuthorizationCredentials | None) -> dict:
        if not credentials:
            raise HTTPException(status_code=401, detail="Login required.")
        conn = self._get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT u.* FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.token = %s", (credentials.credentials,))
            user = cur.fetchone()
            conn.close()
            if not user:
                raise HTTPException(status_code=401, detail="Session expired.")
            return user

    def consume_generation(self, user: dict) -> UserProfile:
        conn = self._get_conn()
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET monthly_used = monthly_used + 1 WHERE id = %s RETURNING *", (user["id"],))
            updated_user = cur.fetchone()
            conn.commit()
            conn.close()
            return self._profile(updated_user)

    def me(self, user: dict) -> UserProfile:
        return self._profile(user)

    def _hash_password(self, password: str) -> str:
        salt = secrets.token_bytes(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return base64.b64encode(salt + digest).decode("ascii")

    def _verify_password(self, password: str, stored: str) -> bool:
        raw = base64.b64decode(stored.encode("ascii"))
        salt, digest = raw[:16], raw[16:]
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return hmac.compare_digest(candidate, digest)

    def _create_session(self, cur, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (token, user_id))
        return token

    def _profile(self, user: dict) -> UserProfile:
        plan = user.get("plan", "free")
        return UserProfile(
            id=user["id"],
            email=user["email"],
            name=user.get("name"),
            plan=plan,
            monthly_limit=PLAN_LIMITS.get(plan, 5),
            monthly_used=user.get("monthly_used", 0),
            role=user.get("role", "user"),
        )

auth_service = AuthService()

def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict:
    return auth_service.current_user(credentials)
