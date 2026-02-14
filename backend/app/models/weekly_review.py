import uuid
from datetime import date, datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ActionStatus(str, PyEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"
    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uq_user_week"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    week_end: Mapped[date] = mapped_column(Date, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    prev_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    changes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    action_title: Mapped[str] = mapped_column(String(500), nullable=False)
    action_detail: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    action_target_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    action_target_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action_status: Mapped[str] = mapped_column(
        Enum(ActionStatus, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
        default=ActionStatus.PENDING,
    )
    action_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    user = relationship("User", back_populates="weekly_reviews")
