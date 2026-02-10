from datetime import date
from typing import Literal

from pydantic import BaseModel


class FinancialInsight(BaseModel):
    priority: int
    category: str
    message: str
    detail: str


class FinancialWarning(BaseModel):
    severity: Literal["low", "medium", "high"] = "medium"
    category: str
    message: str


class FinancialRecommendation(BaseModel):
    action: str
    impact: Literal["low", "medium", "high"] = "medium"
    detail: str


class AnalysisResponse(BaseModel):
    snapshot_date: date
    insights: list[FinancialInsight]
    warnings: list[FinancialWarning]
    recommendations: list[FinancialRecommendation]
    summary: str
