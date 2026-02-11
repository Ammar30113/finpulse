"""Initial schema — all tables

Revision ID: 001_initial
Revises:
Create Date: 2026-02-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- accounts ---
    op.create_table(
        "accounts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("account_type", sa.Enum("chequing", "savings", "credit", name="accounttype"), nullable=False),
        sa.Column("institution", sa.String(255), nullable=True),
        sa.Column("balance", sa.Numeric(12, 2), server_default="0"),
        sa.Column("currency", sa.String(3), server_default="CAD"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- transactions ---
    op.create_table(
        "transactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("account_id", UUID(as_uuid=True), sa.ForeignKey("accounts.id"), index=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("transaction_type", sa.Enum("debit", "credit", name="transactiontype"), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- expenses ---
    op.create_table(
        "expenses",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_recurring", sa.Boolean, server_default="false"),
        sa.Column("frequency", sa.Enum("weekly", "biweekly", "monthly", "yearly", name="frequency"), nullable=True),
        sa.Column("next_due_date", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- credit_cards ---
    op.create_table(
        "credit_cards",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("issuer", sa.String(255), nullable=True),
        sa.Column("credit_limit", sa.Numeric(12, 2), nullable=False),
        sa.Column("current_balance", sa.Numeric(12, 2), server_default="0"),
        sa.Column("statement_day", sa.Integer, nullable=False),
        sa.Column("due_day", sa.Integer, nullable=False),
        sa.Column("apr", sa.Numeric(5, 2), nullable=True),
        sa.Column("min_payment_pct", sa.Numeric(5, 2), server_default="2.0"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- investments ---
    op.create_table(
        "investments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("investment_type", sa.Enum("tfsa", "rrsp", "crypto", "brokerage", "other", name="investmenttype"), nullable=False),
        sa.Column("institution", sa.String(255), nullable=True),
        sa.Column("current_value", sa.Numeric(12, 2), server_default="0"),
        sa.Column("book_value", sa.Numeric(12, 2), server_default="0"),
        sa.Column("monthly_contribution", sa.Numeric(12, 2), server_default="0"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- goals ---
    op.create_table(
        "goals",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("goal_type", sa.Enum("save", "invest", "reduce_utilization", "pay_off_debt", "custom", name="goaltype"), nullable=False),
        sa.Column("target_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("current_amount", sa.Numeric(12, 2), server_default="0"),
        sa.Column("target_date", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- installment_plans ---
    op.create_table(
        "installment_plans",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("monthly_payment", sa.Numeric(12, 2), nullable=False),
        sa.Column("remaining_payments", sa.Integer, nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- analysis_results ---
    op.create_table(
        "analysis_results",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("snapshot_date", sa.Date, nullable=False),
        sa.Column("insights", JSON, nullable=False),
        sa.Column("warnings", JSON, nullable=False),
        sa.Column("recommendations", JSON, nullable=False),
        sa.Column("raw_data", JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("analysis_results")
    op.drop_table("installment_plans")
    op.drop_table("goals")
    op.drop_table("investments")
    op.drop_table("credit_cards")
    op.drop_table("expenses")
    op.drop_table("transactions")
    op.drop_table("accounts")
    op.drop_table("users")

    for enum_name in ["accounttype", "transactiontype", "frequency", "investmenttype", "goaltype"]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
