"""Add notification preference columns to users

Revision ID: 003_notification_prefs
Revises: 002_weekly_reviews
Create Date: 2026-02-16
"""

from alembic import op
import sqlalchemy as sa

revision = "003_notification_prefs"
down_revision = "002_weekly_reviews"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email_notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "users",
        sa.Column("weekly_summary_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "users",
        sa.Column("weekly_summary_day", sa.SmallInteger(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("weekly_summary_hour", sa.SmallInteger(), nullable=False, server_default="9"),
    )
    op.add_column(
        "users",
        sa.Column("notification_timezone", sa.String(length=64), nullable=False, server_default="America/Toronto"),
    )


def downgrade() -> None:
    op.drop_column("users", "notification_timezone")
    op.drop_column("users", "weekly_summary_hour")
    op.drop_column("users", "weekly_summary_day")
    op.drop_column("users", "weekly_summary_enabled")
    op.drop_column("users", "email_notifications_enabled")
