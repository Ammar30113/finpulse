from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.user import User
from app.utils.security import hash_password, verify_password


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Validate credentials and return the user. Raises 401 on failure."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
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

    return user
