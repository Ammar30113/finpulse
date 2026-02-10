from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.credit_card import CreditCard
from app.models.user import User
from app.schemas.credit_card import CreditCardCreate, CreditCardResponse, CreditCardUpdate

router = APIRouter(prefix="/credit-cards", tags=["credit_cards"])


@router.post("/", response_model=CreditCardResponse, status_code=status.HTTP_201_CREATED)
def create_credit_card(
    payload: CreditCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = CreditCard(
        user_id=current_user.id,
        name=payload.name,
        issuer=payload.issuer,
        credit_limit=payload.credit_limit,
        current_balance=payload.current_balance,
        statement_day=payload.statement_day,
        due_day=payload.due_day,
        apr=payload.apr,
        min_payment_pct=payload.min_payment_pct,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.get("/", response_model=list[CreditCardResponse])
def list_credit_cards(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CreditCard)
        .filter(CreditCard.user_id == current_user.id)
        .order_by(CreditCard.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.patch("/{card_id}", response_model=CreditCardResponse)
def update_credit_card(
    card_id: UUID,
    payload: CreditCardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = (
        db.query(CreditCard)
        .filter(CreditCard.id == card_id, CreditCard.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(card, field, value)

    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credit_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = (
        db.query(CreditCard)
        .filter(CreditCard.id == card_id, CreditCard.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card not found")
    db.delete(card)
    db.commit()
