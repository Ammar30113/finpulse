from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.middleware.rate_limit import limiter
from app.routers import analysis, auth, credit_cards, dashboard, expenses, goals, investments, transactions

app = FastAPI(title="FinPulse API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(expenses.router)
app.include_router(credit_cards.router)
app.include_router(investments.router)
app.include_router(goals.router)
app.include_router(transactions.router)
app.include_router(analysis.router)


@app.get("/health")
def health():
    return {"status": "ok"}
