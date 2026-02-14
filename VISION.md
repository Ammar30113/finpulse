# FINPULSE — Vision & Roadmap

## 1) Product Name and Tagline

**Product:** FinPulse
**Tagline:** Weekly Financial Command Center for Canadians

## 2) Product Vision

FinPulse is the weekly money operating system for Canadian professionals.

It turns raw financial data into one clear weekly decision that improves a measurable financial outcome.

We do not build a budgeting toy. We build a decision engine.

## 3) Core Promise

FinPulse guarantees three outcomes:

1. See your full financial picture in under 60 seconds.
2. Receive one prioritized weekly action.
3. Track measurable improvement with minimal manual work.

**If a feature does not strengthen this loop, it does not get built.**

## 4) Ideal Customer Profile (ICP)

Initial focus:

- Canadian salaried professionals (ages 25–40)
- Income: $60k–$150k
- 2+ credit cards
- At least one investment account
- Users with 1–3 concrete financial goals:
  - Debt payoff
  - Savings target
  - Investment consistency
  - Credit utilization reduction

They are not broke — they are overwhelmed.

## 5) North Star Metric

**Weekly Action Completion Rate (WACR)**
Percentage of active users who complete their weekly financial action.

Supporting metrics:

- **Activation:** % who complete first weekly review within 48h
- **Retention:** % who complete 3 reviews in first 30 days
- **Value:** % users with improving metrics in 30 days
- **Revenue:** % paid users completing ≥2 weekly actions / month

## 6) Product Principles

1. Manual-first before automation.
2. One clear action > 10 vague insights.
3. Simplicity over feature sprawl.
4. Data must produce behavior change.
5. AI is assistive, not decorative.

## 7) 12-Month Product Blueprint

### Phase 1 — Foundation & Reliability (0–8 weeks)

**Primary Focus:**
- Stable authentication and onboarding
- Manual data input (accounts, transactions, expenses)
- Accuracy in financial calculation engines
- Weekly Review screen deployed

**Exit Criteria:**
- Signup-to-dashboard ≥ 70%
- Crash-free usage ≥ 99%

### Phase 2 — Activation Wedge (8–16 weeks)

**Primary Focus:**
- CSV import + transaction browsing
- Auto-categorization logic
- Weekly insight loop
- Goal update confirmation

**Exit Criteria:**
- ≥ 40% of new users complete first weekly review within 7 days

### Phase 3 — Retention & Monetization (4–8 months)

**Primary Focus:**
- Paid tier: forecasting features
- Debt optimization logic
- Smart alerts
- Behavioral nudges

**Exit Criteria:**
- D30 retention ≥ 25%
- Free-to-paid conversion ≥ 3–5%

### Phase 4 — Scale & Distribution (8–12 months)

**Primary Focus:**
- Referral loop
- Templates
- Shareable "money wins"
- Household mode
- Social proof loops

**Exit Criteria:**
- ≥ 20% signups from referrals
- CAC remains low

## 8) Feature Roadmap

### Immediate (Weeks 1–4)

- Password reset flow
- Transactions browsing page
- Transaction edit/delete
- Recurring expenses scheduling
- Accounts management page
- **Weekly Review screen (core feature)**

### Next (Weeks 5–10)

- Spending trends + charts
- Smarter insights (week-over-week comparisons)
- Data export (CSV download)
- Email notifications
- UI polish and mobile responsiveness

### Connected (Weeks 11–18)

- Bank sync integration (Flinks / Plaid)
- Auto-categorization improvements
- Credit score tracking
- Eliminate manual data entry reliance

### Essential (Weeks 19–30)

- Budgeting engine
- Tax optimization guidance (TFSA/RRSP)
- Household mode
- AI-enhanced insights + forecasting

## 9) Business Model

**Freemium Pricing:**

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Manual tracking, weekly review, basic insights |
| **Plus** | $5.99/mo | Bank connections, unlimited accounts, auto-categorization |
| **Pro** | $12.99/mo | Forecasting, debt optimization, AI insights, household mode |

Directly positioned under competitors like YNAB and Mint, with a Canadian-first wedge.

## 10) Operating Cadence

### Weekly Routine

**Monday**
- KPI review
- Set one growth bet
- Set one retention bet

**Tuesday–Thursday**
- Ship experiments or features
- Run tests

**Friday**
- User interviews
- Release + retro

**Weekly target:** ship one meaningful improvement tied to a KPI.

## 11) Security & Compliance Principles

- Environment variable management
- JWT auth
- No stored bank credentials
- Token-based connections only
- Strong input validation
- Logging without sensitive data
- Rate limits on sensitive endpoints

## 12) Rules for Future Development

Before building any feature, ask:

> **Does this increase Weekly Action Completion Rate?**

If no → Do not build it.

## 13) Deployment Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Deployment:** Vercel
- **UI:** Headless UI / Tailwind / lightweight charts

### Backend
- **Framework:** FastAPI (Python)
- **Deployment:** Railway
- **Database:** PostgreSQL

### AI Module
- Stateless functions
- Run as backend endpoints
- No long-term memory

## 14) Milestones & Exit Criteria (Quick Look)

| Phase | Primary Gauge |
|-------|---------------|
| Phase 1 | Dashboard usage + stability |
| Phase 2 | Weekly review completion |
| Phase 3 | Retention + paid conversion |
| Phase 4 | Referral + scalability growth |
