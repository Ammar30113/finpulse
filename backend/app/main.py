from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.exceptions import register_exception_handlers
from app.logging_config import setup_logging
from app.middleware.rate_limit import limiter
from app.routers import accounts, analysis, auth, credit_cards, dashboard, expenses, goals, investments, transactions, weekly_review

setup_logging()

API_V1_PREFIX = "/api/v1"

app = FastAPI(title="FinPulse API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=settings.cors_allow_credentials and settings.cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(dashboard.router, prefix=API_V1_PREFIX)
app.include_router(expenses.router, prefix=API_V1_PREFIX)
app.include_router(credit_cards.router, prefix=API_V1_PREFIX)
app.include_router(investments.router, prefix=API_V1_PREFIX)
app.include_router(goals.router, prefix=API_V1_PREFIX)
app.include_router(transactions.router, prefix=API_V1_PREFIX)
app.include_router(accounts.router, prefix=API_V1_PREFIX)
app.include_router(analysis.router, prefix=API_V1_PREFIX)
app.include_router(weekly_review.router, prefix=API_V1_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"name": "FinPulse API", "status": "ok", "health": "/health", "docs": "/docs"}
