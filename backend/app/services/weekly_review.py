from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.credit_card import CreditCard
from app.models.expense import Expense
from app.models.goal import Goal
from app.models.installment_plan import InstallmentPlan
from app.models.investment import Investment
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.models.weekly_review import ActionStatus, WeeklyReview
from app.services.financial import _normalize_to_monthly


def _iso_week_bounds(d: date) -> tuple[date, date]:
    """Return (Monday, Sunday) of the ISO week containing *d*."""
    monday = d - timedelta(days=d.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── public API ──────────────────────────────────────────────────────────


def get_or_create_weekly_review(db: Session, user: User) -> dict:
    today = date.today()
    week_start, week_end = _iso_week_bounds(today)

    existing = (
        db.query(WeeklyReview)
        .filter(WeeklyReview.user_id == user.id, WeeklyReview.week_start == week_start)
        .first()
    )
    if existing:
        return _review_to_dict(existing)

    snapshot = _build_weekly_snapshot(db, user, week_start, week_end)

    prev_review = (
        db.query(WeeklyReview)
        .filter(WeeklyReview.user_id == user.id, WeeklyReview.week_start < week_start)
        .order_by(WeeklyReview.week_start.desc())
        .first()
    )
    prev_snapshot = prev_review.snapshot if prev_review else None
    changes = _compute_changes(snapshot, prev_snapshot) if prev_snapshot else None

    action = _generate_action(db, user, snapshot, week_start)

    review = WeeklyReview(
        user_id=user.id,
        week_start=week_start,
        week_end=week_end,
        snapshot=snapshot,
        prev_snapshot=prev_snapshot,
        changes=changes,
        action_type=action["type"],
        action_title=action["title"],
        action_detail=action.get("detail"),
        action_target_amount=action.get("target_amount"),
        action_target_name=action.get("target_name"),
        action_status=ActionStatus.PENDING,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return _review_to_dict(review)


def complete_action(db: Session, user: User, review_id: str, new_status: str) -> dict:
    review = (
        db.query(WeeklyReview)
        .filter(WeeklyReview.id == review_id, WeeklyReview.user_id == user.id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    if review.action_status != ActionStatus.PENDING.value and review.action_status != ActionStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action already completed or skipped",
        )

    review.action_status = new_status
    review.action_completed_at = _utcnow()
    db.commit()
    db.refresh(review)
    return _review_to_dict(review)


def get_review_history(db: Session, user: User, limit: int = 12) -> dict:
    reviews = (
        db.query(WeeklyReview)
        .filter(WeeklyReview.user_id == user.id)
        .order_by(WeeklyReview.week_start.desc())
        .limit(limit)
        .all()
    )

    non_pending = [r for r in reviews if r.action_status != ActionStatus.PENDING.value and r.action_status != ActionStatus.PENDING]
    completed = [r for r in non_pending if r.action_status == ActionStatus.COMPLETED.value or r.action_status == ActionStatus.COMPLETED]
    wacr = (len(completed) / len(non_pending) * 100) if non_pending else 0

    streak = 0
    for r in reviews:
        s = r.action_status.value if hasattr(r.action_status, "value") else r.action_status
        if s == "completed":
            streak += 1
        else:
            break

    return {
        "reviews": [_review_to_dict(r) for r in reviews],
        "wacr": round(wacr, 1),
        "current_streak": streak,
        "total_completed": len(completed),
        "total_reviews": len(reviews),
    }


# ── snapshot builder ────────────────────────────────────────────────────


def _build_weekly_snapshot(db: Session, user: User, week_start: date, week_end: date) -> dict:
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    cards = db.query(CreditCard).filter(CreditCard.user_id == user.id).all()
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    installments = db.query(InstallmentPlan).filter(InstallmentPlan.user_id == user.id).all()

    account_balance = sum(
        float(a.balance) for a in accounts if a.account_type in ("chequing", "savings")
    )
    savings_balance = sum(
        float(a.balance) for a in accounts if a.account_type == "savings"
    )
    investment_total = sum(float(i.current_value) for i in investments)
    total_assets = account_balance + investment_total

    cc_balance = sum(float(c.current_balance) for c in cards)
    installment_remaining = sum(
        float(ip.monthly_payment) * ip.remaining_payments for ip in installments
    )
    total_liabilities = cc_balance + installment_remaining
    net_worth = total_assets - total_liabilities

    today = date.today()
    first_of_month = today.replace(day=1)
    month_txns = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user.id,
            Transaction.date >= first_of_month,
            Transaction.date <= today,
        )
        .all()
    )
    monthly_income = sum(float(t.amount) for t in month_txns if t.transaction_type == TransactionType.CREDIT)
    recurring_monthly = sum(
        _normalize_to_monthly(float(e.amount), e.frequency) for e in expenses if e.is_recurring
    )
    debit_this_month = sum(float(t.amount) for t in month_txns if t.transaction_type == TransactionType.DEBIT)
    monthly_expenses = recurring_monthly + debit_this_month
    cash_flow = monthly_income - monthly_expenses

    total_cc_limit = sum(float(c.credit_limit) for c in cards)
    credit_utilization_pct = (cc_balance / total_cc_limit * 100) if total_cc_limit > 0 else 0

    week_txns = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user.id,
            Transaction.date >= week_start,
            Transaction.date <= week_end,
        )
        .all()
    )
    weekly_spending = sum(float(t.amount) for t in week_txns if t.transaction_type == TransactionType.DEBIT)
    weekly_income = sum(float(t.amount) for t in week_txns if t.transaction_type == TransactionType.CREDIT)

    return {
        "net_worth": round(net_worth, 2),
        "total_assets": round(total_assets, 2),
        "total_liabilities": round(total_liabilities, 2),
        "monthly_income": round(monthly_income, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "cash_flow": round(cash_flow, 2),
        "credit_utilization_pct": round(credit_utilization_pct, 2),
        "savings_balance": round(savings_balance, 2),
        "weekly_spending": round(weekly_spending, 2),
        "weekly_income": round(weekly_income, 2),
    }


# ── week-over-week changes ─────────────────────────────────────────────


def _pct_change(current: float, previous: float) -> float | None:
    if previous == 0:
        return None
    return round((current - previous) / abs(previous) * 100, 1)


def _compute_changes(current: dict, previous: dict) -> dict:
    return {
        "net_worth_change": {
            "absolute": round(current["net_worth"] - previous["net_worth"], 2),
            "pct": _pct_change(current["net_worth"], previous["net_worth"]),
        },
        "spending_change": {
            "absolute": round(current["weekly_spending"] - previous["weekly_spending"], 2),
            "pct": _pct_change(current["weekly_spending"], previous["weekly_spending"]),
        },
        "savings_change": {
            "absolute": round(current["savings_balance"] - previous["savings_balance"], 2),
            "pct": _pct_change(current["savings_balance"], previous["savings_balance"]),
        },
        "utilization_change": {
            "absolute": round(current["credit_utilization_pct"] - previous["credit_utilization_pct"], 2),
            "pct": None,
        },
    }


# ── action priority algorithm ──────────────────────────────────────────


def _generate_action(db: Session, user: User, snapshot: dict, week_start: date) -> dict:
    candidates: list[tuple[int, dict]] = []

    cards = db.query(CreditCard).filter(CreditCard.user_id == user.id).all()
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    today = date.today()

    util = snapshot["credit_utilization_pct"]

    # --- Credit utilization rules ---
    if cards:
        worst = max(cards, key=lambda c: float(c.current_balance) / float(c.credit_limit) if float(c.credit_limit) > 0 else 0)
        pay_amount = round(float(worst.current_balance) * 0.5, 2) if float(worst.current_balance) > 0 else 0

        if util > 75:
            candidates.append((95, {
                "type": "pay_credit_card",
                "title": f"Pay down ${pay_amount:,.0f} on {worst.name}",
                "detail": f"Your credit utilization is {util:.0f}%, well above the recommended 30%. Paying down this card will improve your credit score.",
                "target_amount": pay_amount,
                "target_name": worst.name,
            }))
        if util > 50:
            candidates.append((85, {
                "type": "pay_credit_card",
                "title": f"Pay down ${pay_amount:,.0f} on {worst.name}",
                "detail": f"Your credit utilization is {util:.0f}%. Getting below 30% will boost your credit score.",
                "target_amount": pay_amount,
                "target_name": worst.name,
            }))
        if util > 30:
            candidates.append((75, {
                "type": "pay_credit_card",
                "title": f"Pay down ${pay_amount:,.0f} on {worst.name}",
                "detail": f"Your utilization is {util:.0f}%. Reducing it further strengthens your credit profile.",
                "target_amount": pay_amount,
                "target_name": worst.name,
            }))

    # --- Off-track goal rules ---
    for g in goals:
        if not g.target_date or float(g.current_amount) >= float(g.target_amount):
            continue
        days_left = (g.target_date - today).days
        if days_left <= 0:
            continue
        remaining = float(g.target_amount) - float(g.current_amount)
        weeks_left = max(days_left / 7, 1)
        weekly_needed = round(remaining / weeks_left, 2)

        if days_left < 30:
            candidates.append((90, {
                "type": "fund_goal",
                "title": f"Add ${weekly_needed:,.0f} to {g.title}",
                "detail": f"Only {days_left} days left to reach your goal. You need ${remaining:,.0f} more.",
                "target_amount": weekly_needed,
                "target_name": g.title,
            }))
        elif days_left < 90:
            candidates.append((70, {
                "type": "fund_goal",
                "title": f"Add ${weekly_needed:,.0f} to {g.title}",
                "detail": f"{days_left} days left. Contributing weekly keeps you on track.",
                "target_amount": weekly_needed,
                "target_name": g.title,
            }))
        elif days_left < 180:
            candidates.append((60, {
                "type": "fund_goal",
                "title": f"Add ${weekly_needed:,.0f} to {g.title}",
                "detail": f"Stay consistent — ${weekly_needed:,.0f}/week gets you to your ${float(g.target_amount):,.0f} goal.",
                "target_amount": weekly_needed,
                "target_name": g.title,
            }))
        else:
            candidates.append((50, {
                "type": "fund_goal",
                "title": f"Add ${weekly_needed:,.0f} to {g.title}",
                "detail": f"Small weekly contributions add up. You're ${remaining:,.0f} away from your goal.",
                "target_amount": weekly_needed,
                "target_name": g.title,
            }))

    # --- Emergency fund rules ---
    savings = snapshot["savings_balance"]
    monthly_exp = snapshot["monthly_expenses"]
    if monthly_exp > 0:
        months_covered = savings / monthly_exp
        target_transfer = round(monthly_exp * 0.25, 2)

        if months_covered < 1:
            candidates.append((80, {
                "type": "build_emergency_fund",
                "title": f"Transfer ${target_transfer:,.0f} to savings",
                "detail": f"You have less than 1 month of expenses saved. Building an emergency fund is critical.",
                "target_amount": target_transfer,
                "target_name": "Savings",
            }))
        if months_covered < 2:
            candidates.append((60, {
                "type": "build_emergency_fund",
                "title": f"Transfer ${target_transfer:,.0f} to savings",
                "detail": f"Your emergency fund covers {months_covered:.1f} months. Aim for at least 3 months.",
                "target_amount": target_transfer,
                "target_name": "Savings",
            }))
        if months_covered < 3:
            candidates.append((40, {
                "type": "build_emergency_fund",
                "title": f"Transfer ${target_transfer:,.0f} to savings",
                "detail": f"You're at {months_covered:.1f} months of expenses. A 3-month cushion provides real security.",
                "target_amount": target_transfer,
                "target_name": "Savings",
            }))

    # --- Overspending rules ---
    prev_review = (
        db.query(WeeklyReview)
        .filter(WeeklyReview.user_id == user.id, WeeklyReview.week_start < week_start)
        .order_by(WeeklyReview.week_start.desc())
        .first()
    )
    if prev_review and prev_review.snapshot:
        prev_spending = prev_review.snapshot.get("weekly_spending", 0)
        spending_diff = snapshot["weekly_spending"] - prev_spending

        # Find top spending category this week
        week_txns = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == user.id,
                Transaction.date >= week_start,
                Transaction.date <= week_start + timedelta(days=6),
                Transaction.transaction_type == TransactionType.DEBIT,
            )
            .all()
        )
        category_totals: dict[str, float] = {}
        for t in week_txns:
            cat = t.category or "Uncategorized"
            category_totals[cat] = category_totals.get(cat, 0) + float(t.amount)

        top_category = max(category_totals, key=category_totals.get) if category_totals else "spending"
        top_amount = round(category_totals.get(top_category, 0), 2)

        if spending_diff > 200:
            candidates.append((65, {
                "type": "reduce_spending",
                "title": f"Reduce {top_category} by ${spending_diff * 0.5:,.0f}",
                "detail": f"You spent ${spending_diff:,.0f} more than last week. {top_category} was your top category at ${top_amount:,.0f}.",
                "target_amount": round(spending_diff * 0.5, 2),
                "target_name": top_category,
            }))
        if spending_diff > 100:
            candidates.append((55, {
                "type": "reduce_spending",
                "title": f"Reduce {top_category} by ${spending_diff * 0.3:,.0f}",
                "detail": f"Spending increased ${spending_diff:,.0f} vs last week. Consider cutting back on {top_category}.",
                "target_amount": round(spending_diff * 0.3, 2),
                "target_name": top_category,
            }))

    # --- Fallback ---
    candidates.append((10, {
        "type": "review_transactions",
        "title": "Review this week's transactions",
        "detail": "Take 5 minutes to review your spending and make sure everything looks right.",
    }))

    # Sort by score descending
    candidates.sort(key=lambda x: x[0], reverse=True)

    # Anti-repeat: check last 2 reviews
    recent_reviews = (
        db.query(WeeklyReview)
        .filter(WeeklyReview.user_id == user.id, WeeklyReview.week_start < week_start)
        .order_by(WeeklyReview.week_start.desc())
        .limit(2)
        .all()
    )
    recent_types = [r.action_type for r in recent_reviews]

    winner_score, winner = candidates[0]
    if len(recent_types) == 2 and all(t == winner["type"] for t in recent_types):
        for score, candidate in candidates[1:]:
            if score >= 30:
                return candidate
                break

    return winner


# ── serialization ───────────────────────────────────────────────────────


def _review_to_dict(review: WeeklyReview) -> dict:
    action_status = review.action_status.value if hasattr(review.action_status, "value") else review.action_status
    return {
        "id": str(review.id),
        "week_start": review.week_start.isoformat(),
        "week_end": review.week_end.isoformat(),
        "snapshot": review.snapshot,
        "changes": review.changes,
        "action": {
            "type": review.action_type,
            "title": review.action_title,
            "detail": review.action_detail,
            "target_amount": float(review.action_target_amount) if review.action_target_amount is not None else None,
            "target_name": review.action_target_name,
            "status": action_status,
            "completed_at": review.action_completed_at.isoformat() if review.action_completed_at else None,
        },
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }
