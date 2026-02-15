from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.weekly_review import (
    CompleteActionRequest,
    WeeklyReviewHistoryResponse,
    WeeklyReviewResponse,
)
from app.services.weekly_review import (
    complete_action,
    get_or_create_weekly_review,
    get_review_history,
)

router = APIRouter(prefix="/weekly-review", tags=["weekly-review"])


@router.get("/current", response_model=WeeklyReviewResponse)
def get_current_review(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_or_create_weekly_review(db, current_user)


@router.patch("/{review_id}/complete-action", response_model=WeeklyReviewResponse)
def complete_review_action(
    review_id: UUID,
    payload: CompleteActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return complete_action(db, current_user, str(review_id), payload.status)


@router.get("/history", response_model=WeeklyReviewHistoryResponse)
def get_history(
    limit: int = Query(12, ge=1, le=52),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_review_history(db, current_user, limit)
