from fastapi import APIRouter, Depends
from app.schemas.auth import AuthRequest, AuthResponse, LoginRequest, UserProfile
from app.services.auth_service import auth_service, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(request: AuthRequest) -> AuthResponse:
    return auth_service.signup(request)


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest) -> AuthResponse:
    return auth_service.login(request)


@router.get("/me", response_model=UserProfile)
def me(user: dict = Depends(get_current_user)) -> UserProfile:
    return auth_service.me(user)
