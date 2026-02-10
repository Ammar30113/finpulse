from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ExpenseCreate(BaseModel):
    category: str
    description: str | None = None
    amount: float
    is_recurring: bool = False
    frequency: str | None = None
    next_due_date: date | None = None


class ExpenseResponse(BaseModel):
    id: UUID
    user_id: UUID
    category: str
    description: str | None = None
    amount: float
    is_recurring: bool
    frequency: str | None = None
    next_due_date: date | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
