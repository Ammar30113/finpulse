from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CreditCardCreate(BaseModel):
    name: str
    issuer: str | None = None
    credit_limit: float
    current_balance: float = 0
    statement_day: int = Field(..., ge=1, le=31)
    due_day: int = Field(..., ge=1, le=31)
    apr: float | None = None
    min_payment_pct: float = 2.0


class CreditCardUpdate(BaseModel):
    current_balance: float | None = None
    credit_limit: float | None = None


class CreditCardResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    issuer: str | None = None
    credit_limit: float
    current_balance: float
    statement_day: int
    due_day: int
    apr: float | None = None
    min_payment_pct: float
    utilization_pct: float = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def compute_utilization(self) -> "CreditCardResponse":
        if self.credit_limit > 0:
            self.utilization_pct = round(self.current_balance / self.credit_limit * 100, 2)
        else:
            self.utilization_pct = 0
        return self
