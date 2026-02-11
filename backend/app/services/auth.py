import logging
import time
from collections import defaultdict

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.user import User
from app.utils.security import hash_password, verify_password

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

    user = User(
        email=email,
        hashed_password=hash_password(password),
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
