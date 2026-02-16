import csv
import io
from datetime import date
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.services.ingestion import bulk_insert_transactions, parse_csv_transactions

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _base_transactions_query(
    db: Session,
    current_user: User,
    account_id: UUID | None,
    category: str | None,
    date_from: date | None,
    date_to: date | None,
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

    return query


def _apply_transaction_sort(
    query,
    sort_by: Literal["date", "amount", "created_at", "category", "description"],
    sort_order: Literal["asc", "desc"],
):
    sort_map = {
        "date": Transaction.date,
        "amount": Transaction.amount,
        "created_at": Transaction.created_at,
        "category": Transaction.category,
        "description": Transaction.description,
    }
    primary_sort_col = sort_map[sort_by]

    if sort_order == "asc":
        return query.order_by(primary_sort_col.asc(), Transaction.created_at.asc())
    return query.order_by(primary_sort_col.desc(), Transaction.created_at.desc())


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
    sort_by: Literal["date", "amount", "created_at", "category", "description"] = Query(
        "date",
        description="Sort field",
    ),
    sort_order: Literal["asc", "desc"] = Query("desc", description="Sort direction"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = _base_transactions_query(
        db=db,
        current_user=current_user,
        account_id=account_id,
        category=category,
        date_from=date_from,
        date_to=date_to,
    )
    query = _apply_transaction_sort(query, sort_by, sort_order)

    return query.offset(offset).limit(limit).all()


@router.get("/count")
def count_transactions(
    account_id: UUID | None = Query(None, description="Filter by account"),
    category: str | None = Query(None, description="Filter by category"),
    date_from: date | None = Query(None, description="Start date (inclusive)"),
    date_to: date | None = Query(None, description="End date (inclusive)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = _base_transactions_query(
        db=db,
        current_user=current_user,
        account_id=account_id,
        category=category,
        date_from=date_from,
        date_to=date_to,
    ).count()
    return {"total": total}


@router.get("/export-csv")
def export_transactions_csv(
    account_id: UUID | None = Query(None, description="Filter by account"),
    category: str | None = Query(None, description="Filter by category"),
    date_from: date | None = Query(None, description="Start date (inclusive)"),
    date_to: date | None = Query(None, description="End date (inclusive)"),
    sort_by: Literal["date", "amount", "created_at", "category", "description"] = Query(
        "date",
        description="Sort field",
    ),
    sort_order: Literal["asc", "desc"] = Query("desc", description="Sort direction"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = _base_transactions_query(
        db=db,
        current_user=current_user,
        account_id=account_id,
        category=category,
        date_from=date_from,
        date_to=date_to,
    )
    query = _apply_transaction_sort(query, sort_by, sort_order)
    transactions = query.all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "date",
            "account_id",
            "transaction_type",
            "amount",
            "category",
            "description",
            "created_at",
        ]
    )

    for transaction in transactions:
        writer.writerow(
            [
                transaction.date.isoformat(),
                str(transaction.account_id),
                transaction.transaction_type.value,
                f"{float(transaction.amount):.2f}",
                transaction.category or "",
                transaction.description or "",
                transaction.created_at.isoformat() if transaction.created_at else "",
            ]
        )

    filename = f"transactions-{date.today().isoformat()}.csv"
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field is required for update",
        )

    if "account_id" in update_data:
        account = (
            db.query(Account)
            .filter(
                Account.id == update_data["account_id"],
                Account.user_id == current_user.id,
            )
            .first()
        )
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found or does not belong to the current user",
            )

    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    db.delete(transaction)
    db.commit()


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

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 5 MB limit",
        )

    transactions = parse_csv_transactions(content, account_id, current_user.id)
    if not transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid transactions found in the CSV file",
        )

    count = bulk_insert_transactions(db, transactions)
    return {"imported": count, "account_id": str(account_id)}
