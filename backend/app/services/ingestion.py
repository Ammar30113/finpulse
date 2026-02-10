import csv
import io
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.transaction import Transaction, TransactionType


def parse_csv_transactions(file_content: bytes, account_id: UUID, user_id: UUID) -> list[dict]:
    """
    Parse a CSV file with columns: date, description, amount, category
    Negative amounts = debit, positive = credit.
    Returns list of transaction dicts ready for DB insertion.
    """
    decoded = file_content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    transactions = []
    for row in reader:
        amount_str = row.get("amount", "0").strip().replace(",", "").replace("$", "")
        try:
            amount = float(amount_str)
        except ValueError:
            continue

        date_str = row.get("date", "").strip()
        try:
            txn_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            try:
                txn_date = datetime.strptime(date_str, "%m/%d/%Y").date()
            except ValueError:
                continue

        transactions.append({
            "account_id": account_id,
            "user_id": user_id,
            "amount": abs(amount),
            "transaction_type": TransactionType.CREDIT if amount > 0 else TransactionType.DEBIT,
            "category": row.get("category", "").strip() or "Uncategorized",
            "description": row.get("description", "").strip(),
            "date": txn_date,
        })

    return transactions


def bulk_insert_transactions(db: Session, transactions: list[dict]) -> int:
    """Insert parsed transactions into the database. Returns count inserted."""
    objects = [Transaction(**txn) for txn in transactions]
    db.add_all(objects)
    db.commit()
    return len(objects)
