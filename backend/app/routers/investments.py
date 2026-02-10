from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.investment import Investment
from app.models.user import User
from app.schemas.investment import InvestmentCreate, InvestmentResponse

router = APIRouter(prefix="/investments", tags=["investments"])


class InvestmentUpdate(InvestmentCreate):
    """Partial update schema — all fields optional."""
    investment_type: str | None = None  # type: ignore[assignment]
    institution: str | None = None
    current_value: float | None = None  # type: ignore[assignment]
    book_value: float | None = None  # type: ignore[assignment]
    monthly_contribution: float | None = None  # type: ignore[assignment]


@router.post("/", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
def create_investment(
    payload: InvestmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    investment = Investment(
        user_id=current_user.id,
        investment_type=payload.investment_type,
        institution=payload.institution,
        current_value=payload.current_value,
        book_value=payload.book_value,
        monthly_contribution=payload.monthly_contribution,
    )
    db.add(investment)
    db.commit()
    db.refresh(investment)
    return investment


@router.get("/", response_model=list[InvestmentResponse])
def list_investments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Investment)
        .filter(Investment.user_id == current_user.id)
        .order_by(Investment.created_at.desc())
        .all()
    )


@router.patch("/{investment_id}", response_model=InvestmentResponse)
def update_investment(
    investment_id: UUID,
    payload: InvestmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    investment = (
        db.query(Investment)
        .filter(Investment.id == investment_id, Investment.user_id == current_user.id)
        .first()
    )
    if not investment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(investment, field, value)

    db.commit()
    db.refresh(investment)
    return investment


@router.delete("/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment(
    investment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    investment = (
        db.query(Investment)
        .filter(Investment.id == investment_id, Investment.user_id == current_user.id)
        .first()
    )
    if not investment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found")
    db.delete(investment)
    db.commit()
