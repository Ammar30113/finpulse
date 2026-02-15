import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAX_BCRYPT_PASSWORD_BYTES = 72


def _password_too_long(password: str) -> bool:
    return len(password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES


def hash_password(password: str) -> str:
    if _password_too_long(password):
        raise ValueError(f"Password must be {MAX_BCRYPT_PASSWORD_BYTES} bytes or fewer")
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if _password_too_long(plain):
        return False
    try:
        return pwd_context.verify(plain, hashed)
    except ValueError:
        return False


def create_access_token(subject: str | None = None, *, data: dict | None = None) -> str:
    if data and "sub" in data:
        sub = data["sub"]
    elif subject is not None:
        sub = subject
    else:
        raise ValueError("Must provide subject or data with 'sub' key")
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes)
    jti = str(uuid.uuid4())
    payload = {"sub": sub, "exp": expire, "jti": jti}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
