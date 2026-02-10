from datetime import date

from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.analysis_result import AnalysisResult
from app.models.credit_card import CreditCard
from app.models.expense import Expense
from app.models.goal import Goal
from app.models.investment import Investment
from app.models.user import User


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

    total_balance = sum(float(a.balance) for a in accounts)
    total_cc_balance = sum(float(c.current_balance) for c in cards)
    total_cc_limit = sum(float(c.credit_limit) for c in cards)
    utilization = (total_cc_balance / total_cc_limit * 100) if total_cc_limit > 0 else 0
    total_investments = sum(float(i.current_value) for i in investments)
    total_monthly_expenses = sum(float(e.amount) for e in expenses if e.is_recurring)

    insights = []
    warnings = []
    recommendations = []

    # INSIGHTS (generate top 3)
    # 1. Net worth insight
    net_worth = total_balance + total_investments - total_cc_balance
    insights.append({
        "priority": 1,
        "category": "net_worth",
        "message": f"Your current net worth is ${net_worth:,.2f}",
        "detail": f"Assets: ${total_balance + total_investments:,.2f} | Liabilities: ${total_cc_balance:,.2f}",
    })

    # 2. Savings rate insight
    if total_monthly_expenses > 0 and total_balance > 0:
        months_runway = total_balance / total_monthly_expenses
        insights.append({
            "priority": 2,
            "category": "savings",
            "message": f"You have {months_runway:.1f} months of expense runway",
            "detail": f"Based on ${total_balance:,.2f} in accounts and ${total_monthly_expenses:,.2f}/mo in recurring expenses",
        })
    else:
        insights.append({
            "priority": 2,
            "category": "savings",
            "message": "Add recurring expenses to track your savings runway",
            "detail": "We need expense data to calculate how long your savings will last",
        })

    # 3. Investment allocation
    total_assets = total_balance + total_investments
    inv_pct = (total_investments / total_assets * 100) if total_assets > 0 else 0
    insights.append({
        "priority": 3,
        "category": "investments",
        "message": f"{inv_pct:.0f}% of your assets are invested",
        "detail": f"${total_investments:,.2f} in investments out of ${total_assets:,.2f} total assets",
    })

    # WARNINGS (generate top 2)
    # 1. Credit utilization warning
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

    # 2. Goal progress warning
    off_track_goals = []
    for g in goals:
        if g.target_date and g.target_amount:
            progress = float(g.current_amount) / float(g.target_amount) * 100 if float(g.target_amount) > 0 else 0
            days_left = (g.target_date - date.today()).days
            if days_left > 0 and progress < 50 and days_left < 180:
                off_track_goals.append(g.title)
    if off_track_goals:
        warnings.append({
            "severity": "medium",
            "category": "goals",
            "message": f"{len(off_track_goals)} goal(s) may be off track: {', '.join(off_track_goals[:3])}",
        })
    else:
        warnings.append({
            "severity": "low",
            "category": "goals",
            "message": "All goals are on track" if goals else "No financial goals set yet",
        })

    # RECOMMENDATIONS (generate top 2)
    # 1. Based on utilization
    if utilization > 30:
        highest_card = max(cards, key=lambda c: float(c.current_balance) / float(c.credit_limit) if float(c.credit_limit) > 0 else 0) if cards else None
        recommendations.append({
            "action": f"Pay down {highest_card.name if highest_card else 'credit card'} balance",
            "impact": "high",
            "detail": f"Reducing utilization from {utilization:.0f}% to under 30% will improve your credit score and reduce interest charges",
        })
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

    # 2. Emergency fund check
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
    if utilization > 30:
        summary_parts.append(f"Credit utilization at {utilization:.0f}% needs attention.")
    if off_track_goals:
        summary_parts.append(f"{len(off_track_goals)} goal(s) may need adjustment.")
    summary_parts.append(f"You have ${total_investments:,.2f} invested across {len(investments)} account(s).")

    result = {
        "snapshot_date": date.today().isoformat(),
        "insights": insights[:3],
        "warnings": warnings[:2],
        "recommendations": recommendations[:2],
        "summary": " ".join(summary_parts),
    }

    # Persist analysis result
    analysis_record = AnalysisResult(
        user_id=user.id,
        snapshot_date=date.today(),
        insights=insights[:3],
        warnings=warnings[:2],
        recommendations=recommendations[:2],
        raw_data={"net_worth": net_worth, "utilization": utilization, "total_investments": total_investments},
    )
    db.add(analysis_record)
    db.commit()

    return result
