import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.user import User
from app.utils.security import hash_password, verify_password

logger = logging.getLogger("finpulse.auth")

# Account lockout: max 5 failed attempts, 15-minute window
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Validate credentials and return the user. Raises 401 on failure, 429 on lockout.

    Lockout state is persisted in the database so it survives restarts and works
    across multiple workers (#6).
    """
    user = db.query(User).filter(User.email == email).first()

    # Check lockout (even if user doesn't exist, don't reveal that)
    if user and user.locked_until and user.locked_until > _utcnow():
        logger.warning("Account locked out: %s (until %s)", email, user.locked_until)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again in 15 minutes.",
        )

    if not user or not verify_password(password, user.hashed_password):
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
                user.locked_until = _utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
                logger.warning("Account locked: %s after %d failed attempts", email, user.failed_login_attempts)
            db.commit()
        logger.info("Failed login attempt for %s", email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful login — clear lockout state
    if user.failed_login_attempts or user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

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
