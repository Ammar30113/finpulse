from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.credit_card import CreditCard
from app.models.expense import Expense
from app.models.goal import Goal
from app.models.installment_plan import InstallmentPlan
from app.models.investment import Investment
from app.models.transaction import Transaction
from app.models.user import User


def _normalize_to_monthly(amount: float, frequency: str | None) -> float:
    """Convert a recurring expense amount to its monthly equivalent."""
    if not frequency:
        return amount
    freq = frequency.lower()
    if freq == "weekly":
        return amount * 52 / 12
    elif freq == "biweekly":
        return amount * 26 / 12
    elif freq == "monthly":
        return amount
    elif freq == "yearly":
        return amount / 12
    return amount


def build_dashboard_summary(db: Session, user: User) -> dict:
    """Aggregate all user financial data into a single dashboard payload."""
    # Fetch all user data
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    cards = db.query(CreditCard).filter(CreditCard.user_id == user.id).all()
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    installments = db.query(InstallmentPlan).filter(InstallmentPlan.user_id == user.id).all()

    today = date.today()
    first_of_month = today.replace(day=1)

    # Current month transactions
    month_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user.id,
            Transaction.date >= first_of_month,
            Transaction.date <= today,
        )
        .all()
    )

    # --- Compute aggregates ---

    # Assets: chequing + savings balances + investment values
    account_balance = sum(
        float(a.balance)
        for a in accounts
        if a.account_type in ("chequing", "savings")
    )
    investment_total = sum(float(i.current_value) for i in investments)
    total_assets = account_balance + investment_total

    # Liabilities: credit card balances + remaining installment amounts
    cc_balance = sum(float(c.current_balance) for c in cards)
    installment_remaining = sum(
        float(ip.remaining_amount) for ip in installments if hasattr(ip, "remaining_amount")
    )
    total_liabilities = cc_balance + installment_remaining

    net_worth = total_assets - total_liabilities

    # Monthly income: sum of credit-type transactions this month
    monthly_income = sum(
        float(t.amount)
        for t in month_transactions
        if str(t.transaction_type).lower() in ("credit", "transactiontype.credit")
    )

    # Monthly expenses: recurring expenses (normalized) + debit transactions this month
    recurring_monthly = sum(
        _normalize_to_monthly(float(e.amount), e.frequency if hasattr(e, "frequency") else None)
        for e in expenses
        if e.is_recurring
    )
    debit_this_month = sum(
        float(t.amount)
        for t in month_transactions
        if str(t.transaction_type).lower() in ("debit", "transactiontype.debit")
    )
    monthly_expenses = recurring_monthly + debit_this_month

    cash_flow = monthly_income - monthly_expenses

    # Credit utilization
    total_cc_limit = sum(float(c.credit_limit) for c in cards)
    credit_utilization_pct = (cc_balance / total_cc_limit * 100) if total_cc_limit > 0 else 0

    # Upcoming bills: recurring expenses with next_due_date in next 30 days
    thirty_days = today + timedelta(days=30)
    upcoming_bills = [
        {
            "category": e.category,
            "amount": float(e.amount),
            "next_due_date": e.next_due_date.isoformat() if e.next_due_date else None,
            "description": e.description,
        }
        for e in expenses
        if e.is_recurring and e.next_due_date and today <= e.next_due_date <= thirty_days
    ]

    # Goals summary
    goals_summary = [
        {
            "title": g.title,
            "goal_type": g.goal_type.value if hasattr(g.goal_type, "value") else g.goal_type,
            "target_amount": float(g.target_amount),
            "current_amount": float(g.current_amount),
            "progress_pct": round(
                float(g.current_amount) / float(g.target_amount) * 100, 1
            )
            if float(g.target_amount) > 0
            else 0,
            "target_date": g.target_date.isoformat() if g.target_date else None,
        }
        for g in goals
    ]

    # Recent transactions (last 10)
    recent_txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .limit(10)
        .all()
    )
    recent_transactions = [
        {
            "id": str(t.id),
            "amount": float(t.amount),
            "transaction_type": t.transaction_type.value
            if hasattr(t.transaction_type, "value")
            else str(t.transaction_type),
            "category": t.category,
            "description": t.description,
            "date": t.date.isoformat() if t.date else None,
        }
        for t in recent_txns
    ]

    return {
        "net_worth": round(net_worth, 2),
        "total_assets": round(total_assets, 2),
        "total_liabilities": round(total_liabilities, 2),
        "monthly_income": round(monthly_income, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "cash_flow": round(cash_flow, 2),
        "credit_utilization_pct": round(credit_utilization_pct, 2),
        "upcoming_bills": upcoming_bills,
        "goals_summary": goals_summary,
        "recent_transactions": recent_transactions,
    }
