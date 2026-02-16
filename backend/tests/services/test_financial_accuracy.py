from datetime import date, timedelta
from types import SimpleNamespace

from app.models.account import Account
from app.models.analysis_result import AnalysisResult
from app.models.credit_card import CreditCard
from app.models.expense import Expense
from app.models.goal import Goal
from app.models.installment_plan import InstallmentPlan
from app.models.investment import Investment
from app.models.transaction import Transaction, TransactionType
from app.models.weekly_review import WeeklyReview
from app.services.analysis import generate_analysis
from app.services.financial import _compute_monthly_expenses, build_dashboard_summary
from app.services.weekly_review import _build_weekly_snapshot, _generate_action


class FakeQuery:
    def __init__(self, items):
        self._items = list(items)

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def limit(self, n):
        self._items = self._items[:n]
        return self

    def all(self):
        return list(self._items)

    def first(self):
        return self._items[0] if self._items else None


class FakeSession:
    def __init__(self, data):
        self._data = data
        self.added = []
        self.commits = 0
        self.rollbacks = 0

    def query(self, model):
        return FakeQuery(self._data.get(model, []))

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1


def _make_user():
    return SimpleNamespace(id="user-1")


def _expense(category, amount, description=None, frequency="monthly", recurring=True):
    return SimpleNamespace(
        category=category,
        amount=amount,
        description=description,
        frequency=frequency,
        is_recurring=recurring,
        next_due_date=None,
    )


def _txn(amount, txn_type, category, description=None, d=None):
    return SimpleNamespace(
        id=f"txn-{amount}-{category}",
        amount=amount,
        transaction_type=txn_type,
        category=category,
        description=description,
        date=d or date.today(),
        created_at=None,
    )


def test_compute_monthly_expenses_avoids_recurring_double_count():
    expenses = [
        _expense("Housing", 2000, description="Rent", frequency="monthly"),
        _expense("Insurance", 100, description="Auto", frequency="monthly"),
    ]
    month_txns = [
        _txn(2000, TransactionType.DEBIT, "Housing", description="Rent"),
        _txn(500, TransactionType.DEBIT, "Food", description="Groceries"),
    ]

    monthly_expenses = _compute_monthly_expenses(expenses, month_txns)
    assert monthly_expenses == 2600


def test_dashboard_summary_uses_deduped_monthly_expenses():
    user = _make_user()
    expenses = [
        _expense("Housing", 2000, description="Rent", frequency="monthly"),
        _expense("Insurance", 100, description="Auto", frequency="monthly"),
    ]
    month_txns = [
        _txn(3000, TransactionType.CREDIT, "Income", description="Salary"),
        _txn(2000, TransactionType.DEBIT, "Housing", description="Rent"),
        _txn(500, TransactionType.DEBIT, "Food", description="Groceries"),
    ]
    db = FakeSession(
        {
            Account: [
                SimpleNamespace(balance=5000, account_type="chequing"),
                SimpleNamespace(balance=0, account_type="savings"),
            ],
            CreditCard: [],
            Investment: [],
            Expense: expenses,
            Goal: [],
            InstallmentPlan: [],
            Transaction: month_txns,
        }
    )

    summary = build_dashboard_summary(db, user)
    assert summary["monthly_expenses"] == 2600
    assert summary["monthly_income"] == 3000
    assert summary["cash_flow"] == 400


def test_weekly_snapshot_uses_deduped_monthly_expenses():
    user = _make_user()
    expenses = [
        _expense("Housing", 2000, description="Rent", frequency="monthly"),
        _expense("Insurance", 100, description="Auto", frequency="monthly"),
    ]
    week_start = date.today() - timedelta(days=date.today().weekday())
    week_end = week_start + timedelta(days=6)
    month_txns = [
        _txn(3000, TransactionType.CREDIT, "Income", description="Salary", d=week_start),
        _txn(2000, TransactionType.DEBIT, "Housing", description="Rent", d=week_start),
        _txn(500, TransactionType.DEBIT, "Food", description="Groceries", d=week_start),
    ]
    db = FakeSession(
        {
            Account: [
                SimpleNamespace(balance=5000, account_type="chequing"),
                SimpleNamespace(balance=0, account_type="savings"),
            ],
            CreditCard: [],
            Investment: [],
            Expense: expenses,
            InstallmentPlan: [],
            Transaction: month_txns,
        }
    )

    snapshot = _build_weekly_snapshot(db, user, week_start, week_end)
    assert snapshot["monthly_expenses"] == 2600
    assert snapshot["monthly_income"] == 3000
    assert snapshot["cash_flow"] == 400


def test_generate_action_anti_repeat_falls_back_when_no_alternative():
    user = _make_user()
    db = FakeSession(
        {
            CreditCard: [
                SimpleNamespace(name="Visa", current_balance=6000, credit_limit=7000),
            ],
            Goal: [],
            WeeklyReview: [
                SimpleNamespace(action_type="pay_credit_card", snapshot=None),
                SimpleNamespace(action_type="pay_credit_card", snapshot=None),
            ],
            Transaction: [],
        }
    )
    snapshot = {
        "credit_utilization_pct": 85,
        "savings_balance": 0,
        "monthly_expenses": 0,
        "weekly_spending": 0,
    }

    action = _generate_action(db, user, snapshot, date.today())
    assert action["type"] == "review_transactions"


def test_generate_action_anti_repeat_chooses_different_high_priority_action():
    user = _make_user()
    db = FakeSession(
        {
            CreditCard: [
                SimpleNamespace(name="Visa", current_balance=6000, credit_limit=7000),
            ],
            Goal: [],
            WeeklyReview: [
                SimpleNamespace(action_type="pay_credit_card", snapshot=None),
                SimpleNamespace(action_type="pay_credit_card", snapshot=None),
            ],
            Transaction: [],
        }
    )
    snapshot = {
        "credit_utilization_pct": 85,
        "savings_balance": 100,
        "monthly_expenses": 1000,
        "weekly_spending": 0,
    }

    action = _generate_action(db, user, snapshot, date.today())
    assert action["type"] == "build_emergency_fund"


def test_analysis_uses_monthly_normalized_expense_runway():
    user = _make_user()
    db = FakeSession(
        {
            Account: [SimpleNamespace(balance=5200)],
            CreditCard: [],
            Expense: [_expense("Housing", 120, description="Rent", frequency="weekly")],
            Investment: [],
            Goal: [],
            AnalysisResult: [],
        }
    )

    result = generate_analysis(db, user)

    savings_insight = next(i for i in result["insights"] if i["category"] == "savings")
    assert "10.0 months" in savings_insight["message"]
    assert "$520.00/mo" in savings_insight["detail"]
    assert db.commits == 1


def test_analysis_includes_week_over_week_spending_comparison():
    user = _make_user()
    today = date.today()
    this_week_start = today - timedelta(days=today.weekday())
    prev_week_start = this_week_start - timedelta(days=7)

    txns = [
        _txn(500, TransactionType.DEBIT, "Food", description="Groceries", d=this_week_start),
        _txn(300, TransactionType.DEBIT, "Food", description="Dining", d=prev_week_start),
    ]
    db = FakeSession(
        {
            Account: [SimpleNamespace(balance=3000)],
            CreditCard: [],
            Expense: [],
            Investment: [],
            Goal: [],
            Transaction: txns,
            AnalysisResult: [],
        }
    )

    result = generate_analysis(db, user)

    trend_insight = next(i for i in result["insights"] if i["category"] == "spending_trend")
    assert "vs last week" in trend_insight["message"]
    assert "$500.00 this week vs $300.00 last week" in trend_insight["detail"]


def test_analysis_net_worth_compares_with_previous_snapshot():
    user = _make_user()
    previous_snapshot = SimpleNamespace(
        raw_data={"net_worth": 1000},
        snapshot_date=date.today() - timedelta(days=7),
    )
    db = FakeSession(
        {
            Account: [SimpleNamespace(balance=2000)],
            CreditCard: [],
            Expense: [],
            Investment: [],
            Goal: [],
            Transaction: [],
            AnalysisResult: [previous_snapshot],
        }
    )

    result = generate_analysis(db, user)

    net_worth_insight = next(i for i in result["insights"] if i["category"] == "net_worth")
    assert "since last snapshot" in net_worth_insight["message"]
    assert "$1,000.00" in net_worth_insight["message"]


def test_dashboard_summary_includes_weekly_and_category_trends():
    user = _make_user()
    today = date.today()
    this_week_start = today - timedelta(days=today.weekday())
    prev_week_start = this_week_start - timedelta(days=7)

    month_txns = [
        _txn(2500, TransactionType.CREDIT, "Income", description="Salary", d=this_week_start),
        _txn(420, TransactionType.DEBIT, "Food", description="Groceries", d=this_week_start),
        _txn(180, TransactionType.DEBIT, "Transport", description="Transit", d=this_week_start),
        _txn(300, TransactionType.DEBIT, "Food", description="Dining", d=prev_week_start),
        _txn(150, TransactionType.DEBIT, "Entertainment", description="Movies", d=prev_week_start),
    ]
    db = FakeSession(
        {
            Account: [SimpleNamespace(balance=4000, account_type="chequing")],
            CreditCard: [],
            Investment: [],
            Expense: [],
            Goal: [],
            InstallmentPlan: [],
            Transaction: month_txns,
        }
    )

    summary = build_dashboard_summary(db, user)

    assert len(summary["spending_trend"]) == 8
    latest_week = summary["spending_trend"][-1]
    assert latest_week["week_start"] == this_week_start.isoformat()
    assert latest_week["spending"] == 600

    assert summary["category_spending"][0]["category"] == "Food"
    assert summary["category_spending"][0]["amount"] == 720
