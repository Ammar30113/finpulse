import logging
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.analysis_result import AnalysisResult
from app.models.credit_card import CreditCard
from app.models.expense import Expense
from app.models.goal import Goal
from app.models.investment import Investment
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.services.financial import _normalize_to_monthly

logger = logging.getLogger("finpulse.analysis")


def _pct_change(current: float, previous: float) -> float | None:
    if previous == 0:
        return None
    return round((current - previous) / abs(previous) * 100, 1)


def generate_analysis(db: Session, user: User) -> dict:
    """
    Analyze user's financial snapshot and generate:
    - 3 prioritized insights
    - 2 warnings
    - 2 actionable recommendations
    All rule-based, deterministic, explainable.
    """
    # Gather data
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    cards = db.query(CreditCard).filter(CreditCard.user_id == user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    investments = db.query(Investment).filter(Investment.user_id == user.id).all()
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    prev_week_start = week_start - timedelta(days=7)

    total_balance = sum(float(a.balance) for a in accounts)
    total_cc_balance = sum(float(c.current_balance) for c in cards)
    total_cc_limit = sum(float(c.credit_limit) for c in cards)
    utilization = (total_cc_balance / total_cc_limit * 100) if total_cc_limit > 0 else 0
    total_investments = sum(float(i.current_value) for i in investments)
    total_monthly_expenses = sum(
        _normalize_to_monthly(float(e.amount), e.frequency)
        for e in expenses
        if e.is_recurring
    )
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user.id,
            Transaction.date >= prev_week_start,
            Transaction.date <= today,
        )
        .all()
    )

    insights = []
    warnings = []
    recommendations = []

    current_week_debits = [
        t
        for t in transactions
        if t.transaction_type == TransactionType.DEBIT and t.date >= week_start
    ]
    previous_week_debits = [
        t
        for t in transactions
        if t.transaction_type == TransactionType.DEBIT and prev_week_start <= t.date < week_start
    ]
    current_week_credits = [
        t
        for t in transactions
        if t.transaction_type == TransactionType.CREDIT and t.date >= week_start
    ]
    previous_week_credits = [
        t
        for t in transactions
        if t.transaction_type == TransactionType.CREDIT and prev_week_start <= t.date < week_start
    ]
    current_week_spending = sum(float(t.amount) for t in current_week_debits)
    previous_week_spending = sum(float(t.amount) for t in previous_week_debits)
    current_week_income = sum(float(t.amount) for t in current_week_credits)
    previous_week_income = sum(float(t.amount) for t in previous_week_credits)

    this_week_categories: dict[str, float] = {}
    for txn in current_week_debits:
        category = (txn.category or "Uncategorized").strip() or "Uncategorized"
        this_week_categories[category] = this_week_categories.get(category, 0.0) + float(
            txn.amount
        )
    top_weekly_category = (
        max(this_week_categories, key=this_week_categories.get)
        if this_week_categories
        else "Spending"
    )
    top_weekly_category_amount = (
        round(this_week_categories.get(top_weekly_category, 0.0), 2)
        if this_week_categories
        else 0.0
    )

    previous_analysis = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.user_id == user.id, AnalysisResult.snapshot_date < today)
        .order_by(AnalysisResult.snapshot_date.desc())
        .first()
    )
    previous_net_worth = None
    if previous_analysis and previous_analysis.raw_data:
        raw_prev_net_worth = previous_analysis.raw_data.get("net_worth")
        if isinstance(raw_prev_net_worth, (int, float)):
            previous_net_worth = float(raw_prev_net_worth)

    # INSIGHTS (generate top 3)
    # 1) Week-over-week spending insight
    if previous_week_spending > 0:
        spending_delta = current_week_spending - previous_week_spending
        spending_delta_pct = _pct_change(current_week_spending, previous_week_spending)
        if spending_delta > 0:
            message = f"Weekly spending increased {abs(spending_delta_pct or 0):.1f}% vs last week"
        elif spending_delta < 0:
            message = f"Weekly spending decreased {abs(spending_delta_pct or 0):.1f}% vs last week"
        else:
            message = "Weekly spending is flat vs last week"
        insights.append(
            {
                "priority": 1,
                "category": "spending_trend",
                "message": message,
                "detail": (
                    f"${current_week_spending:,.2f} this week vs ${previous_week_spending:,.2f} last week. "
                    f"Top category: {top_weekly_category} (${top_weekly_category_amount:,.2f})."
                ),
            }
        )
    elif current_week_spending > 0:
        insights.append(
            {
                "priority": 1,
                "category": "spending_trend",
                "message": f"You spent ${current_week_spending:,.2f} so far this week",
                "detail": (
                    f"Top category this week is {top_weekly_category} at "
                    f"${top_weekly_category_amount:,.2f}. We'll compare trends once a full prior week is available."
                ),
            }
        )
    else:
        insights.append(
            {
                "priority": 1,
                "category": "spending_trend",
                "message": "No debit spending recorded yet this week",
                "detail": "As transactions come in, FinPulse will compare your week-over-week spending trend.",
            }
        )

    # 2) Net worth insight
    net_worth = total_balance + total_investments - total_cc_balance
    if previous_net_worth is not None:
        net_worth_delta = net_worth - previous_net_worth
        net_worth_delta_pct = _pct_change(net_worth, previous_net_worth)
        direction = "up" if net_worth_delta >= 0 else "down"
        insights.append(
            {
                "priority": 2,
                "category": "net_worth",
                "message": (
                    f"Net worth is {direction} ${abs(net_worth_delta):,.2f} "
                    f"({abs(net_worth_delta_pct or 0):.1f}%) since last snapshot"
                ),
                "detail": (
                    f"Current net worth is ${net_worth:,.2f} "
                    f"(assets ${total_balance + total_investments:,.2f}, liabilities ${total_cc_balance:,.2f})."
                ),
            }
        )
    else:
        insights.append(
            {
                "priority": 2,
                "category": "net_worth",
                "message": f"Your current net worth is ${net_worth:,.2f}",
                "detail": f"Assets: ${total_balance + total_investments:,.2f} | Liabilities: ${total_cc_balance:,.2f}",
            }
        )

    # 3) Savings runway insight
    if total_monthly_expenses > 0 and total_balance > 0:
        months_runway = total_balance / total_monthly_expenses
        income_trend_pct = _pct_change(current_week_income, previous_week_income)
        income_trend_text = (
            f" Weekly income is {'up' if (income_trend_pct or 0) >= 0 else 'down'} "
            f"{abs(income_trend_pct or 0):.1f}% vs last week."
            if previous_week_income > 0
            else ""
        )
        insights.append(
            {
                "priority": 3,
                "category": "savings",
                "message": f"You have {months_runway:.1f} months of expense runway",
                "detail": (
                    f"Based on ${total_balance:,.2f} in accounts and "
                    f"${total_monthly_expenses:,.2f}/mo in recurring expenses."
                    f"{income_trend_text}"
                ),
            }
        )
    else:
        insights.append(
            {
                "priority": 3,
                "category": "savings",
                "message": "Add recurring expenses to track your savings runway",
                "detail": "We need expense data to calculate how long your savings will last.",
            }
        )

    # WARNINGS (generate top 2)
    # 1) Credit utilization warning
    if utilization > 30:
        severity = "high" if utilization > 75 else "medium"
        warnings.append({
            "severity": severity,
            "category": "credit_utilization",
            "message": f"Credit utilization is {utilization:.0f}% — {'critically high' if utilization > 75 else 'above recommended 30%'}",
        })
    else:
        warnings.append({
            "severity": "low",
            "category": "credit_utilization",
            "message": f"Credit utilization is healthy at {utilization:.0f}%",
        })

    # 2) Weekly spending spike warning (fallback to goals warning)
    if previous_week_spending > 0 and current_week_spending > previous_week_spending * 1.2:
        spike_amount = current_week_spending - previous_week_spending
        warnings.append(
            {
                "severity": "high" if current_week_spending > previous_week_spending * 1.5 else "medium",
                "category": "spending_spike",
                "message": (
                    f"Spending is up ${spike_amount:,.0f} vs last week, led by "
                    f"{top_weekly_category} (${top_weekly_category_amount:,.0f})"
                ),
            }
        )

    # Goal progress warning
    off_track_goals = []
    for g in goals:
        if g.target_date and g.target_amount:
            progress = float(g.current_amount) / float(g.target_amount) * 100 if float(g.target_amount) > 0 else 0
            days_left = (g.target_date - today).days
            if days_left > 0 and progress < 50 and days_left < 180:
                off_track_goals.append(g.title)
    if len(warnings) < 2 and off_track_goals:
        warnings.append({
            "severity": "medium",
            "category": "goals",
            "message": f"{len(off_track_goals)} goal(s) may be off track: {', '.join(off_track_goals[:3])}",
        })
    elif len(warnings) < 2:
        warnings.append({
            "severity": "low",
            "category": "goals",
            "message": "All goals are on track" if goals else "No financial goals set yet",
        })

    # RECOMMENDATIONS (generate top 2)
    # 1) Based on utilization or spending trend
    if utilization > 30:
        highest_card = max(cards, key=lambda c: float(c.current_balance) / float(c.credit_limit) if float(c.credit_limit) > 0 else 0) if cards else None
        recommendations.append({
            "action": f"Pay down {highest_card.name if highest_card else 'credit card'} balance",
            "impact": "high",
            "detail": f"Reducing utilization from {utilization:.0f}% to under 30% will improve your credit score and reduce interest charges",
        })
    elif previous_week_spending > 0 and current_week_spending > previous_week_spending * 1.1:
        recommendations.append(
            {
                "action": f"Cap {top_weekly_category} spending this week",
                "impact": "high",
                "detail": (
                    f"{top_weekly_category} is driving your weekly increase. "
                    f"Set a temporary cap to reverse the trend."
                ),
            }
        )
    elif not investments:
        recommendations.append({
            "action": "Start investing in a TFSA or RRSP",
            "impact": "high",
            "detail": "With low credit utilization, you're in a good position to begin building investment wealth",
        })
    else:
        recommendations.append({
            "action": "Increase monthly investment contributions",
            "impact": "medium",
            "detail": "Consider increasing contributions to maximize tax-advantaged account room",
        })

    # 2) Emergency fund check
    if total_monthly_expenses > 0:
        emergency_months = total_balance / total_monthly_expenses
        if emergency_months < 3:
            recommendations.append({
                "action": "Build emergency fund to 3-6 months of expenses",
                "impact": "high",
                "detail": f"You currently have {emergency_months:.1f} months. Target: ${total_monthly_expenses * 3:,.2f} minimum",
            })
        else:
            recommendations.append({
                "action": "Review expense categories for optimization opportunities",
                "impact": "medium",
                "detail": "Your emergency fund is solid. Look for subscriptions or expenses you can reduce",
            })
    else:
        recommendations.append({
            "action": "Track your recurring expenses",
            "impact": "medium",
            "detail": "Adding expense data enables personalized savings and investment recommendations",
        })

    # Build summary
    summary_parts = []
    summary_parts.append(f"Net worth: ${net_worth:,.2f}.")
    if previous_week_spending > 0:
        spending_delta = current_week_spending - previous_week_spending
        direction = "up" if spending_delta >= 0 else "down"
        summary_parts.append(
            f"Weekly spending is {direction} ${abs(spending_delta):,.2f} vs last week."
        )
    if utilization > 30:
        summary_parts.append(f"Credit utilization at {utilization:.0f}% needs attention.")
    if off_track_goals:
        summary_parts.append(f"{len(off_track_goals)} goal(s) may need adjustment.")
    summary_parts.append(f"You have ${total_investments:,.2f} invested across {len(investments)} account(s).")

    result = {
        "snapshot_date": today.isoformat(),
        "insights": insights[:3],
        "warnings": warnings[:2],
        "recommendations": recommendations[:2],
        "summary": " ".join(summary_parts),
    }

    # Persist analysis result
    try:
        analysis_record = AnalysisResult(
            user_id=user.id,
            snapshot_date=today,
            insights=insights[:3],
            warnings=warnings[:2],
            recommendations=recommendations[:2],
            raw_data={
                "net_worth": net_worth,
                "utilization": utilization,
                "total_investments": total_investments,
                "current_week_spending": current_week_spending,
                "previous_week_spending": previous_week_spending,
                "current_week_income": current_week_income,
                "previous_week_income": previous_week_income,
                "months_runway": (total_balance / total_monthly_expenses) if total_monthly_expenses > 0 else None,
            },
        )
        db.add(analysis_record)
        db.commit()
        logger.info("Analysis snapshot persisted for user %s", user.id)
    except Exception:
        db.rollback()
        logger.exception("Failed to persist analysis snapshot for user %s", user.id)

    return result
