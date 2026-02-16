from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.notification import (
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationTestResponse,
)
from app.services.notifications import (
    WEEKDAY_LABELS,
    build_weekly_summary_text,
    send_notification_email,
    serialize_notification_preferences,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/preferences", response_model=NotificationPreferencesResponse)
def get_notification_preferences(
    current_user: User = Depends(get_current_user),
):
    return serialize_notification_preferences(current_user)


@router.patch("/preferences", response_model=NotificationPreferencesResponse)
def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one preference field is required",
        )

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return serialize_notification_preferences(current_user)


@router.post("/test", response_model=NotificationTestResponse)
def send_test_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.email_notifications_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enable email notifications before sending a test email",
        )

    body = build_weekly_summary_text(db, current_user)
    weekday = WEEKDAY_LABELS[int(current_user.weekly_summary_day) % 7]
    subject = (
        f"FinPulse Weekly Snapshot - {weekday} "
        f"{int(current_user.weekly_summary_hour):02d}:00 {current_user.notification_timezone}"
    )
    delivered = send_notification_email(current_user.email, subject, body)

    if delivered:
        return {"status": "sent", "detail": "Test email sent"}

    return {
        "status": "logged_only",
        "detail": "SMTP is not configured. A preview was logged on the backend.",
    }
