from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.middleware.rate_limit import limiter
from app.models.revoked_token import RevokedToken
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth import authenticate_user, register_user
from app.utils.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer()


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    token = create_access_token(data={"sub": str(user.id)})
    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=LoginResponse)
@limiter.limit("3/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, payload.email, payload.password, payload.full_name)
    token = create_access_token(data={"sub": str(user.id)})
    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", status_code=204)
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke the current access token so it can no longer be used (#7)."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except Exception:
        return  # Token already invalid, nothing to revoke

    jti = payload.get("jti")
    if not jti:
        return  # Legacy token without jti, can't revoke

    exp = payload.get("exp")
    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc) if exp else datetime.now(timezone.utc)

    existing = db.query(RevokedToken).filter(RevokedToken.jti == jti).first()
    if not existing:
        db.add(RevokedToken(jti=jti, user_id=current_user.id, expires_at=expires_at))
        db.commit()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
