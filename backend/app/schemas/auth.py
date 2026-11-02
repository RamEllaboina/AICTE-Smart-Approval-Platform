from typing import Optional, List
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: "UserSessionInfo"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserSessionInfo(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    roles: List[str]
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
