from datetime import date

from sqlalchemy.orm import Session

from app.models.goal import Goal


def calculate_goal_forecast(goal: Goal) -> dict:
    """Calculate if a goal is on track based on current progress and time remaining."""
    if not goal.target_date or float(goal.target_amount) == 0:
        return {"on_track": None, "monthly_needed": None, "projected_completion": None}

    progress_pct = float(goal.current_amount) / float(goal.target_amount) * 100
    days_left = (goal.target_date - date.today()).days
    months_left = max(days_left / 30, 1)
    remaining = float(goal.target_amount) - float(goal.current_amount)
    monthly_needed = remaining / months_left if months_left > 0 else remaining

    # Time-based progress check: are we on pace?
    total_days = (goal.target_date - goal.created_at.date()).days if goal.created_at else days_left
    expected_progress = ((total_days - days_left) / total_days * 100) if total_days > 0 else 0
    on_track = progress_pct >= expected_progress * 0.8  # 80% of expected pace

    return {
        "on_track": on_track,
        "progress_pct": round(progress_pct, 1),
        "monthly_needed": round(monthly_needed, 2),
        "days_remaining": days_left,
    }


def get_goals_with_forecasts(db: Session, user_id) -> list[dict]:
    goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    results = []
    for g in goals:
        forecast = calculate_goal_forecast(g)
        results.append({
            "id": str(g.id),
            "title": g.title,
            "goal_type": g.goal_type.value if hasattr(g.goal_type, "value") else g.goal_type,
            "target_amount": float(g.target_amount),
            "current_amount": float(g.current_amount),
            "target_date": g.target_date.isoformat() if g.target_date else None,
            **forecast,
        })
    return results
