from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TransactionCreate(BaseModel):
    account_id: UUID
    amount: float
    transaction_type: str
    category: str | None = None
    description: str | None = None
    date: date


class TransactionResponse(BaseModel):
    id: UUID
    user_id: UUID
    account_id: UUID
    amount: float
    transaction_type: str
    category: str | None = None
    description: str | None = None
    date: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
