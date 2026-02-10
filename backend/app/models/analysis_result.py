import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)
    insights: Mapped[dict] = mapped_column(JSON, nullable=False)
    warnings: Mapped[dict] = mapped_column(JSON, nullable=False)
    recommendations: Mapped[dict] = mapped_column(JSON, nullable=False)
    raw_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
