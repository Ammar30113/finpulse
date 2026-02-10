from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.goal import Goal
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate
from app.services.goals import calculate_goal_forecast

router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = Goal(
        user_id=current_user.id,
        title=payload.title,
        goal_type=payload.goal_type,
        target_amount=payload.target_amount,
        current_amount=payload.current_amount,
        target_date=payload.target_date,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    forecast = calculate_goal_forecast(goal)
    resp = GoalResponse.model_validate(goal)
    resp.on_track = forecast.get("on_track")
    resp.monthly_needed = forecast.get("monthly_needed")
    resp.days_remaining = forecast.get("days_remaining")
    return resp


@router.get("/", response_model=list[GoalResponse])
def list_goals(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .order_by(Goal.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    results = []
    for g in goals:
        forecast = calculate_goal_forecast(g)
        resp = GoalResponse.model_validate(g)
        resp.on_track = forecast.get("on_track")
        resp.monthly_needed = forecast.get("monthly_needed")
        resp.days_remaining = forecast.get("days_remaining")
        results.append(resp)
    return results


@router.patch("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: UUID,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    forecast = calculate_goal_forecast(goal)
    resp = GoalResponse.model_validate(goal)
    resp.on_track = forecast.get("on_track")
    resp.monthly_needed = forecast.get("monthly_needed")
    resp.days_remaining = forecast.get("days_remaining")
    return resp


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    db.delete(goal)
    db.commit()
