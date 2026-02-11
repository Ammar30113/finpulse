import csv
import hashlib
import io
import logging
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.transaction import Transaction, TransactionType

logger = logging.getLogger("finpulse.ingestion")

REQUIRED_COLUMNS = {"date", "description", "amount"}


def _transaction_hash(account_id: UUID, txn_date, amount: float, description: str) -> str:
    raw = f"{account_id}|{txn_date}|{amount}|{description}"
    return hashlib.sha256(raw.encode()).hexdigest()


def parse_csv_transactions(file_content: bytes, account_id: UUID, user_id: UUID) -> list[dict]:
    """
    Parse a CSV file with columns: date, description, amount, category (optional).
    Negative amounts = debit, positive = credit.
    Returns list of transaction dicts ready for DB insertion.
    """
    decoded = file_content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file has no headers",
        )

    headers = {h.strip().lower() for h in reader.fieldnames}
    missing = REQUIRED_COLUMNS - headers
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV missing required columns: {', '.join(sorted(missing))}. Found: {', '.join(sorted(headers))}",
        )

    transactions = []
    skipped = 0
    for row_num, row in enumerate(reader, start=2):  # start=2 accounts for header row
        amount_str = row.get("amount", "0").strip().replace(",", "").replace("$", "")
        try:
            amount = float(amount_str)
        except ValueError:
            skipped += 1
            logger.warning("Row %d: invalid amount '%s', skipping", row_num, amount_str)
            continue

        date_str = row.get("date", "").strip()
        try:
            txn_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            try:
                txn_date = datetime.strptime(date_str, "%m/%d/%Y").date()
            except ValueError:
                skipped += 1
                logger.warning("Row %d: unparseable date '%s', skipping", row_num, date_str)
                continue

        description = row.get("description", "").strip()

        transactions.append({
            "account_id": account_id,
            "user_id": user_id,
            "amount": abs(amount),
            "transaction_type": TransactionType.CREDIT if amount > 0 else TransactionType.DEBIT,
            "category": row.get("category", "").strip() or "Uncategorized",
            "description": description,
            "date": txn_date,
            "_hash": _transaction_hash(account_id, txn_date, abs(amount), description),
        })

    if skipped:
        logger.info("CSV parse complete: %d transactions parsed, %d rows skipped", len(transactions), skipped)
    return transactions


def bulk_insert_transactions(db: Session, transactions: list[dict]) -> int:
    """Insert parsed transactions into the database, skipping duplicates. Returns count inserted."""
    if not transactions:
        return 0

    hashes = [t["_hash"] for t in transactions]
    user_id = transactions[0]["user_id"]
    account_id = transactions[0]["account_id"]

    # Find existing transactions to detect duplicates
    existing = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.account_id == account_id,
        )
        .all()
    )
    existing_hashes = {
        _transaction_hash(e.account_id, e.date, float(e.amount), e.description or "")
        for e in existing
    }

    new_txns = []
    for txn in transactions:
        if txn["_hash"] not in existing_hashes:
            txn_data = {k: v for k, v in txn.items() if k != "_hash"}
            new_txns.append(Transaction(**txn_data))

    if new_txns:
        db.add_all(new_txns)
        db.commit()
    return len(new_txns)
