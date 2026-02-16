import logging
import time
from collections import defaultdict
from uuid import UUID

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.models.account import Account
from app.models.user import User
from app.services.supabase_auth import (
    SupabaseAuthError,
    send_recovery_email,
    sign_in_with_password,
    sign_up_user,
    update_password_with_access_token,
)
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


def _build_password_reset_redirect_url() -> str | None:
    base = (settings.frontend_base_url or "").rstrip("/")
    if not base:
        return None
    return f"{base}/login?mode=reset"


def _ensure_default_account(db: Session, user_id: UUID) -> None:
    existing = db.query(Account).filter(Account.user_id == user_id).first()
    if existing:
        return

    default_account = Account(
        user_id=user_id,
        name="Main Chequing",
        account_type="chequing",
        balance=0,
        currency="CAD",
    )
    db.add(default_account)


def _sync_local_password_hash(db: Session, user: User, password: str) -> None:
    user.hashed_password = hash_password(password)
    db.add(user)
    db.commit()


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
    if user and verify_password(password, user.hashed_password):
        _failed_attempts.pop(email, None)
        return user

    if settings.supabase_enabled:
        try:
            supabase_sign_in = sign_in_with_password(email, password)
            supabase_user = supabase_sign_in.get("user") or {}
            supabase_user_id = supabase_user.get("id")
            if not supabase_user_id:
                raise SupabaseAuthError("Supabase login returned no user id", status_code=502)
            supabase_uuid = UUID(str(supabase_user_id))

            if not user:
                full_name = (supabase_user.get("user_metadata") or {}).get("full_name") or email.split("@")[0]
                user = User(
                    id=supabase_uuid,
                    email=email,
                    hashed_password=hash_password(password),
                    full_name=full_name,
                )
                db.add(user)
                db.flush()
                _ensure_default_account(db, user.id)
                db.commit()
                db.refresh(user)
                logger.info("Provisioned local user from Supabase auth: %s", user.id)
            else:
                _sync_local_password_hash(db, user, password)
                db.refresh(user)

            _failed_attempts.pop(email, None)
            return user
        except SupabaseAuthError:
            logger.info("Supabase login failed for %s", email)

    if not user or not verify_password(password, user.hashed_password):
        _failed_attempts[email].append(time.monotonic())
        logger.info("Failed login attempt for %s", email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def register_user(db: Session, email: str, password: str, full_name: str) -> User:
    """Create a new user account with a default chequing account. Raises 409 if email exists."""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    supabase_user_id = None
    if settings.supabase_enabled:
        try:
            supabase_signup = sign_up_user(email, password, full_name)
            supabase_user = supabase_signup.get("user") or {}
            supabase_user_id = supabase_user.get("id")
            if not supabase_user_id:
                raise SupabaseAuthError("Supabase signup returned no user id", status_code=502)
            supabase_user_id = UUID(str(supabase_user_id))
        except SupabaseAuthError as exc:
            if exc.status_code in (400, 409):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists",
                ) from exc
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Supabase signup failed: {exc.detail}",
            ) from exc

    user_kwargs = {
        "email": email,
        "hashed_password": hash_password(password),
        "full_name": full_name,
    }
    if supabase_user_id:
        user_kwargs["id"] = supabase_user_id

    user = User(**user_kwargs)
    db.add(user)
    db.flush()  # Flush to get the user.id before creating the account

    _ensure_default_account(db, user.id)
    db.commit()
    db.refresh(user)

    logger.info("New user registered: %s", user.id)
    return user


def request_password_reset(db: Session, email: str) -> None:
    """Generate a reset token and deliver/log reset instructions if the user exists."""
    if settings.supabase_enabled:
        try:
            send_recovery_email(email, _build_password_reset_redirect_url())
            logger.info("Supabase recovery email requested for %s", email)
            return
        except SupabaseAuthError:
            logger.exception("Failed to request Supabase recovery email for %s", email)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return

    token = create_password_reset_token(user.email, user.hashed_password)
    logger.warning(
        "Falling back to local reset token for %s (Supabase not configured/reachable): %s",
        user.email,
        token,
    )


def reset_password(db: Session, token: str, new_password: str) -> None:
    """Validate reset token and update the user's password."""
    if settings.supabase_enabled:
        try:
            result = update_password_with_access_token(token, new_password)
            supabase_user = result.get("user") or {}
            email = supabase_user.get("email")
            if email:
                user = db.query(User).filter(User.email == email).first()
                if user:
                    _sync_local_password_hash(db, user, new_password)
                    _failed_attempts.pop(user.email, None)
                    logger.info("Password reset completed via Supabase for user: %s", user.id)
                    return

            logger.info("Supabase password updated; local user not found for sync")
            return
        except SupabaseAuthError:
            logger.info("Supabase access-token password update failed; attempting local token flow")

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
