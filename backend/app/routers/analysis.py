from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.analysis import AnalysisResponse
from app.services.analysis import generate_analysis

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/insights", response_model=AnalysisResponse)
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return generate_analysis(db, current_user)
