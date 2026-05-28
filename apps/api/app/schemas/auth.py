from pydantic import BaseModel, EmailStr, Field


class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = Field(default=None, max_length=80)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class GoogleAuthRequest(BaseModel):
    credential: str = Field(min_length=20)


class UserProfile(BaseModel):
    id: str
    email: str
    name: str | None = None
    plan: str
    monthly_limit: int
    monthly_used: int
    role: str = "user"


class AuthResponse(BaseModel):
    token: str
    user: UserProfile
