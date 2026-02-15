from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.services.ingestion import bulk_insert_transactions, parse_csv_transactions

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify the account belongs to the current user
    account = (
        db.query(Account)
        .filter(Account.id == payload.account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or does not belong to the current user",
        )

    transaction = Transaction(
        user_id=current_user.id,
        account_id=payload.account_id,
        amount=payload.amount,
        transaction_type=payload.transaction_type,
        category=payload.category,
        description=payload.description,
        date=payload.date,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    account_id: UUID | None = Query(None, description="Filter by account"),
    category: str | None = Query(None, description="Filter by category"),
    date_from: date | None = Query(None, description="Start date (inclusive)"),
    date_to: date | None = Query(None, description="End date (inclusive)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if category:
        query = query.filter(Transaction.category == category)
    if date_from:
        query = query.filter(Transaction.date >= date_from)
    if date_to:
        query = query.filter(Transaction.date <= date_to)

    return query.order_by(Transaction.date.desc(), Transaction.created_at.desc()).offset(offset).limit(limit).all()


@router.post("/upload-csv", status_code=status.HTTP_201_CREATED)
async def upload_csv_transactions(
    file: UploadFile,
    account_id: UUID = Query(..., description="Target account for imported transactions"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify account ownership
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or does not belong to the current user",
        )

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted",
        )

    # Read in chunks to enforce size limit before loading entire file into memory (#5)
    max_size = 5 * 1024 * 1024  # 5 MB
    chunks = []
    total = 0
    while True:
        chunk = await file.read(64 * 1024)  # 64 KB chunks
        if not chunk:
            break
        total += len(chunk)
        if total > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 5 MB limit",
            )
        chunks.append(chunk)
    content = b"".join(chunks)

    transactions = parse_csv_transactions(content, account_id, current_user.id)
    if not transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid transactions found in the CSV file",
        )

    count = bulk_insert_transactions(db, transactions)
    return {"imported": count, "account_id": str(account_id)}
