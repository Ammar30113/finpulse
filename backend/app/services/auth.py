import logging
import time
from collections import defaultdict

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.models.account import Account
from app.models.user import User
from app.utils.security import (
    create_password_reset_token,
    decode_password_reset_token,
    fingerprint_password_hash,
    hash_password,
    verify_password,
)

logger = logging.getLogger("finpulse.auth")

# Account lockout: max 5 failed attempts, 15-minute window
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 900  # 15 minutes

# {email: [(timestamp, ...), ...]}
_failed_attempts: dict[str, list[float]] = defaultdict(list)


def _prune_old_attempts(email: str) -> list[float]:
    cutoff = time.monotonic() - LOCKOUT_SECONDS
    attempts = [t for t in _failed_attempts[email] if t > cutoff]
    _failed_attempts[email] = attempts
    return attempts


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Validate credentials and return the user. Raises 401 on failure, 429 on lockout."""
    recent = _prune_old_attempts(email)
    if len(recent) >= MAX_FAILED_ATTEMPTS:
        logger.warning("Account locked out: %s (%d failed attempts)", email, len(recent))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again in 15 minutes.",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        _failed_attempts[email].append(time.monotonic())
        logger.info("Failed login attempt for %s", email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful login — clear failed attempts
    _failed_attempts.pop(email, None)
    return user


def register_user(db: Session, email: str, password: str, full_name: str) -> User:
    """Create a new user account with a default chequing account. Raises 409 if email exists."""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    try:
        hashed_password = hash_password(password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
    )
    db.add(user)
    db.flush()  # Flush to get the user.id before creating the account

    default_account = Account(
        user_id=user.id,
        name="Main Chequing",
        account_type="chequing",
        balance=0,
        currency="CAD",
    )
    db.add(default_account)
    db.commit()
    db.refresh(user)

    logger.info("New user registered: %s", user.id)
    return user


def _build_password_reset_url(token: str) -> str | None:
    base = (settings.frontend_base_url or "").rstrip("/")
    if not base:
        return None
    return f"{base}/login?mode=reset&token={token}"


def request_password_reset(db: Session, email: str) -> None:
    """Generate a reset token and deliver/log reset instructions if the user exists."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return

    token = create_password_reset_token(user.email, user.hashed_password)
    reset_url = _build_password_reset_url(token)
    if reset_url:
        logger.info("Password reset link generated for %s: %s", user.email, reset_url)
    else:
        logger.info("Password reset token generated for %s: %s", user.email, token)


def reset_password(db: Session, token: str, new_password: str) -> None:
    """Validate reset token and update the user's password."""
    try:
        email, token_fingerprint = decode_password_reset_token(token)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    current_fingerprint = fingerprint_password_hash(user.hashed_password)
    if current_fingerprint != token_fingerprint:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is no longer valid",
        )

    try:
        user.hashed_password = hash_password(new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    db.add(user)
    db.commit()
    _failed_attempts.pop(user.email, None)
    logger.info("Password reset completed for user: %s", user.id)
