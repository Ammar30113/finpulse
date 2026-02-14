from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class WeeklySnapshotData(BaseModel):
    net_worth: float
    total_assets: float
    total_liabilities: float
    monthly_income: float
    monthly_expenses: float
    cash_flow: float
    credit_utilization_pct: float
    savings_balance: float
    weekly_spending: float
    weekly_income: float


class MetricChange(BaseModel):
    absolute: float
    pct: float | None = None


class WeeklyChanges(BaseModel):
    net_worth_change: MetricChange
    spending_change: MetricChange
    savings_change: MetricChange
    utilization_change: MetricChange


class WeeklyAction(BaseModel):
    type: str
    title: str
    detail: str | None = None
    target_amount: float | None = None
    target_name: str | None = None
    status: str
    completed_at: datetime | None = None


class WeeklyReviewResponse(BaseModel):
    id: UUID
    week_start: date
    week_end: date
    snapshot: WeeklySnapshotData
    changes: WeeklyChanges | None = None
    action: WeeklyAction
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompleteActionRequest(BaseModel):
    status: Literal["completed", "skipped"]


class WeeklyReviewHistoryResponse(BaseModel):
    reviews: list[WeeklyReviewResponse]
    wacr: float
    current_streak: int
    total_completed: int
    total_reviews: int
