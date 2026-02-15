from pydantic import BaseModel


class DashboardSummary(BaseModel):
    net_worth: float
    total_assets: float
    total_liabilities: float
    monthly_income: float
    monthly_expenses: float
    cash_flow: float
    credit_utilization_pct: float
    savings_balance: float
    upcoming_bills: list[dict]
    goals_summary: list[dict]
    recent_transactions: list[dict]
