import logging
import smtplib
import ssl
from datetime import date
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.services.financial import build_dashboard_summary

logger = logging.getLogger("finpulse.notifications")

WEEKDAY_LABELS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


def serialize_notification_preferences(user: User) -> dict:
    return {
        "email_notifications_enabled": bool(user.email_notifications_enabled),
        "weekly_summary_enabled": bool(user.weekly_summary_enabled),
        "weekly_summary_day": int(user.weekly_summary_day),
        "weekly_summary_hour": int(user.weekly_summary_hour),
        "notification_timezone": user.notification_timezone,
    }


def build_weekly_summary_text(db: Session, user: User) -> str:
    dashboard = build_dashboard_summary(db, user)
    today = date.today().isoformat()

    lines = [
        f"FinPulse Weekly Snapshot ({today})",
        "",
        f"Net worth: ${dashboard['net_worth']:,.2f}",
        f"Cash flow (monthly): ${dashboard['cash_flow']:,.2f}",
        f"Credit utilization: {dashboard['credit_utilization_pct']:.1f}%",
        f"Monthly income: ${dashboard['monthly_income']:,.2f}",
        f"Monthly expenses: ${dashboard['monthly_expenses']:,.2f}",
        "",
    ]

    upcoming_bills = dashboard.get("upcoming_bills") or []
    if upcoming_bills:
        lines.append("Upcoming bills:")
        for bill in upcoming_bills[:3]:
            lines.append(
                f"- {bill['description']} ({bill['due_date']}): ${float(bill['amount']):,.2f}"
            )
        lines.append("")

    goals = dashboard.get("goals_summary") or []
    if goals:
        lines.append("Goal progress:")
        for goal in goals[:3]:
            lines.append(
                f"- {goal['title']}: {float(goal['progress_pct']):.1f}% "
                f"(${float(goal['current_amount']):,.2f} / ${float(goal['target_amount']):,.2f})"
            )
        lines.append("")

    lines.append("Open FinPulse to review details and take your weekly action.")
    return "\n".join(lines)


def send_notification_email(to_email: str, subject: str, body: str) -> bool:
    if not settings.smtp_host or not settings.smtp_from_email:
        logger.info("SMTP not configured; skipping email send to %s", to_email)
        logger.info("Email subject: %s", subject)
        logger.info("Email body preview: %s", body[:300])
        return False

    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
            if settings.smtp_use_tls:
                server.starttls(context=ssl.create_default_context())
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
        logger.info("Notification email sent to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send notification email to %s", to_email)
        return False
