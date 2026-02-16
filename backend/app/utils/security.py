from datetime import datetime, timedelta, timezone
import hashlib

from jose import jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAX_BCRYPT_PASSWORD_BYTES = 72
PASSWORD_RESET_TOKEN_TYPE = "password_reset"


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
    payload = {"sub": sub, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def fingerprint_password_hash(password_hash: str) -> str:
    return hashlib.sha256(password_hash.encode("utf-8")).hexdigest()


def create_password_reset_token(email: str, password_hash: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_expiration_minutes)
    payload = {
        "sub": email,
        "typ": PASSWORD_RESET_TOKEN_TYPE,
        "pwh": fingerprint_password_hash(password_hash),
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_password_reset_token(token: str) -> tuple[str, str]:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    if payload.get("typ") != PASSWORD_RESET_TOKEN_TYPE:
        raise ValueError("Invalid token type")

    email = payload.get("sub")
    password_hash_fingerprint = payload.get("pwh")
    if not isinstance(email, str) or not email:
        raise ValueError("Invalid token subject")
    if not isinstance(password_hash_fingerprint, str) or not password_hash_fingerprint:
        raise ValueError("Invalid token fingerprint")

    return email, password_hash_fingerprint
