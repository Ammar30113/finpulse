from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.transaction import TransactionType


class TransactionCreate(BaseModel):
    account_id: UUID
    amount: float
    transaction_type: TransactionType
    category: str | None = None
    description: str | None = None
    date: date


class TransactionUpdate(BaseModel):
    account_id: UUID | None = None
    amount: float | None = None
    transaction_type: TransactionType | None = None
    category: str | None = None
    description: str | None = None
    date: date | None = None


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
