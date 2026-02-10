from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


class InvestmentCreate(BaseModel):
    investment_type: str
    institution: str | None = None
    current_value: float = 0
    book_value: float = 0
    monthly_contribution: float = 0


class InvestmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    investment_type: str
    institution: str | None = None
    current_value: float
    book_value: float
    monthly_contribution: float
    gain_loss: float = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def compute_gain_loss(self) -> "InvestmentResponse":
        self.gain_loss = round(self.current_value - self.book_value, 2)
        return self
