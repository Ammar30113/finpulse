import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserResponse

_PASSWORD_PATTERN = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/`~]).{8,}$"
)
_PASSWORD_MSG = (
    "Password must be at least 8 characters with 1 uppercase, "
    "1 lowercase, 1 digit, and 1 special character"
)
_PASSWORD_MAX_BYTES = 72
_PASSWORD_MAX_BYTES_MSG = "Password must be 72 bytes or fewer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v.encode("utf-8")) > _PASSWORD_MAX_BYTES:
            raise ValueError(_PASSWORD_MAX_BYTES_MSG)
        if not _PASSWORD_PATTERN.match(v):
            raise ValueError(_PASSWORD_MSG)
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
