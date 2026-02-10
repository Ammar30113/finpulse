from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AccountCreate(BaseModel):
    name: str
    account_type: str
    institution: str | None = None
    balance: float = 0
    currency: str = "CAD"


class AccountResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    account_type: str
    institution: str | None = None
    balance: float
    currency: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
