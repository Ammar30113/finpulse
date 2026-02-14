"""Add weekly_reviews table

Revision ID: 002_weekly_reviews
Revises: 001_initial
Create Date: 2026-02-14
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

revision = "002_weekly_reviews"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "weekly_reviews",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("week_start", sa.Date, nullable=False),
        sa.Column("week_end", sa.Date, nullable=False),
        sa.Column("snapshot", JSON, nullable=False),
        sa.Column("prev_snapshot", JSON, nullable=True),
        sa.Column("changes", JSON, nullable=True),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column("action_title", sa.String(500), nullable=False),
        sa.Column("action_detail", sa.String(1000), nullable=True),
        sa.Column("action_target_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("action_target_name", sa.String(255), nullable=True),
        sa.Column(
            "action_status",
            sa.Enum("pending", "completed", "skipped", name="actionstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("action_completed_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "week_start", name="uq_user_week"),
    )


def downgrade() -> None:
    op.drop_table("weekly_reviews")
    op.execute("DROP TYPE IF EXISTS actionstatus")
