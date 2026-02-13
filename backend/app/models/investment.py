import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class InvestmentType(str, PyEnum):
    TFSA = "tfsa"
    RRSP = "rrsp"
    CRYPTO = "crypto"
    BROKERAGE = "brokerage"
    OTHER = "other"


class Investment(Base):
    __tablename__ = "investments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    investment_type: Mapped[str] = mapped_column(
        Enum(InvestmentType, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
    institution: Mapped[str] = mapped_column(String(255), nullable=True)
    current_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    book_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    monthly_contribution: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    user = relationship("User", back_populates="investments")
