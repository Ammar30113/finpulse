"""Add lockout columns to users, revoked_tokens table, dedup_hash to transactions

Revision ID: 003_security_dedup
Revises: 002_weekly_reviews
Create Date: 2026-02-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "003_security_dedup"
down_revision = "002_weekly_reviews"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # #6: Add login lockout columns to users table
    op.add_column("users", sa.Column("failed_login_attempts", sa.Integer, server_default="0", nullable=False))
    op.add_column("users", sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True))

    # #7: Create revoked_tokens table for JWT revocation
    op.create_table(
        "revoked_tokens",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("jti", sa.String(64), unique=True, index=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # #12: Add dedup_hash column to transactions for efficient duplicate detection
    op.add_column("transactions", sa.Column("dedup_hash", sa.String(64), nullable=True))
    op.create_index("ix_transactions_dedup_hash", "transactions", ["dedup_hash"])


def downgrade() -> None:
    op.drop_index("ix_transactions_dedup_hash", table_name="transactions")
    op.drop_column("transactions", "dedup_hash")
    op.drop_table("revoked_tokens")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_attempts")
