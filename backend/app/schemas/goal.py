from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


class GoalCreate(BaseModel):
    title: str
    goal_type: str
    target_amount: float
    current_amount: float = 0
    target_date: date | None = None


class GoalUpdate(BaseModel):
    current_amount: float | None = None
    target_amount: float | None = None
    target_date: date | None = None


class GoalResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    goal_type: str
    target_amount: float
    current_amount: float
    target_date: date | None = None
    progress_pct: float = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def compute_progress(self) -> "GoalResponse":
        if self.target_amount > 0:
            self.progress_pct = round(self.current_amount / self.target_amount * 100, 2)
        else:
            self.progress_pct = 0
        return self
