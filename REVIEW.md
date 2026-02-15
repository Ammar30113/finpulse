# Code Review — FinPulse

**Date:** 2026-02-15
**Scope:** Full codebase review (backend + frontend), with focus on the latest theme tokens / UI styling commit.

---

## Summary

FinPulse is a well-structured full-stack financial management app with solid architectural decisions: clear separation of concerns, proper JWT auth, rate limiting, and a thoughtful weekly review feature. The codebase is clean and readable. This review identifies several bugs, security concerns, and areas for improvement.

---

## Bugs

### 1. Dead code after `return` in action anti-repeat logic (HIGH)

**File:** `backend/app/services/weekly_review.py:423`

```python
for score, candidate in candidates[1:]:
    if score >= 30:
        return candidate
        break  # dead code — never reached
```

The `break` on line 423 is unreachable. More importantly, this loop has a subtle logic error: if no alternative candidate has `score >= 30`, it falls through and returns `winner` anyway (which is the repeated action). The intent was to avoid repeating the same action type 3 weeks in a row, but the fallback defeats the purpose. Consider returning the fallback "review_transactions" action if no alternatives qualify.

### 2. Monthly expense double-counting (MEDIUM)

**File:** `backend/app/services/weekly_review.py:167-172` and `backend/app/services/financial.py:86-96`

```python
recurring_monthly = sum(
    _normalize_to_monthly(float(e.amount), e.frequency) for e in expenses if e.is_recurring
)
debit_this_month = sum(float(t.amount) for t in month_txns if t.transaction_type == TransactionType.DEBIT)
monthly_expenses = recurring_monthly + debit_this_month
```

If a user records a recurring expense (e.g. rent) in the `expenses` table AND also logs it as a debit transaction, the expense gets counted twice — once via the normalized recurring amount and once via the transaction. This inflates `monthly_expenses`, deflates `cash_flow`, and distorts the emergency fund calculation.

### 3. Credit utilization rules emit overlapping candidates (LOW)

**File:** `backend/app/services/weekly_review.py:250-273`

When utilization is >75%, all three `if` blocks (>75, >50, >30) fire because they use `if` rather than `elif`. This produces three near-identical "pay down credit card" candidates. While the sorting picks the highest-scored one, the duplicate candidates add noise and could interfere with the anti-repeat logic.

### 4. Emergency fund rules also emit overlapping candidates (LOW)

**File:** `backend/app/services/weekly_review.py:326-349`

Same pattern: `if months_covered < 1`, `if months_covered < 2`, `if months_covered < 3` — when coverage is <1, all three fire.

### 5. CSV file size check happens after full read into memory (LOW)

**File:** `backend/app/routers/transactions.py:101-106`

```python
content = await file.read()
if len(content) > 5 * 1024 * 1024:
```

The entire file is read into memory before the size check. A large upload can consume server memory before being rejected. Consider using `file.size` from the UploadFile metadata or reading in chunks with an early abort.

---

## Security

### 6. In-memory login lockout doesn't survive restarts (MEDIUM)

**File:** `backend/app/services/auth.py:19`

```python
_failed_attempts: dict[str, list[float]] = defaultdict(list)
```

The account lockout state is stored in a process-level dict. It resets on every deployment/restart and doesn't work across multiple workers. An attacker can bypass the lockout by waiting for a deploy or by having requests routed to different workers. Consider persisting lockout state in Redis or the database.

### 7. No JWT token revocation mechanism (LOW)

There's no way to invalidate a JWT after logout. The token remains valid until expiry (60 minutes). If a token is compromised, there's no way to revoke it. A server-side token blocklist (Redis-backed) or short-lived tokens with refresh tokens would improve this.

### 8. Encryption key truncation is fragile (LOW)

**File:** `backend/app/utils/encryption.py:13`

```python
_key = base64.urlsafe_b64encode(_raw_key[:32])
```

Silently truncating keys longer than 32 bytes can lead to different `ENCRYPTION_KEY` values producing the same Fernet key. Consider raising an error if the key isn't exactly 32 bytes, or document this behavior clearly.

### 9. `complete_action` accepts `new_status` as raw string (LOW)

**File:** `backend/app/services/weekly_review.py:77`

```python
def complete_action(db: Session, user: User, review_id: str, new_status: str) -> dict:
    ...
    review.action_status = new_status
```

Although the Pydantic schema constrains the input to `Literal["completed", "skipped"]`, the service function accepts an arbitrary string. If the service is ever called from another code path (e.g. a CLI tool, a migration script), invalid status values could be written. Consider validating against `ActionStatus` inside the service function.

---

## Architecture & Design

### 10. Dashboard and weekly snapshot share duplicated aggregation logic (MEDIUM)

**Files:** `backend/app/services/financial.py:34-167` and `backend/app/services/weekly_review.py:132-200`

`_build_weekly_snapshot` and `build_dashboard_summary` independently compute net worth, total assets, liabilities, monthly income/expenses, and credit utilization using nearly identical code. This violates DRY and means a fix in one place won't propagate to the other. Consider extracting a shared `_compute_financial_aggregates(db, user)` function.

### 11. `analysis.py` uses `total_monthly_expenses` without frequency normalization (MEDIUM)

**File:** `backend/app/services/analysis.py:37`

```python
total_monthly_expenses = sum(float(e.amount) for e in expenses if e.is_recurring)
```

Unlike `financial.py` and `weekly_review.py`, the analysis service sums raw expense amounts without calling `_normalize_to_monthly()`. A weekly $100 expense is counted as $100/month instead of $433/month. This produces incorrect savings runway and emergency fund calculations in the analysis insights.

### 12. Bulk duplicate detection loads all user transactions (LOW)

**File:** `backend/app/services/ingestion.py:96-107`

```python
existing = (
    db.query(Transaction)
    .filter(Transaction.user_id == user_id, Transaction.account_id == account_id)
    .all()
)
```

For users with many transactions, this loads every transaction into memory to compute hashes. A more efficient approach would store the hash as a column on the `Transaction` model and use an `IN` query or a database-level unique constraint on the hash.

---

## Frontend

### 13. `InsightsPanel` manages its own data fetching independently (LOW)

**File:** `frontend/src/components/dashboard/InsightsPanel.tsx:12-22`

Unlike the other dashboard panels that receive data via props from `useDashboard`, `InsightsPanel` makes its own API call to `/analysis/insights`. This means a manual "Refresh" in the dashboard header refreshes the main dashboard data but not insights. Consider either fetching insights in `useDashboard` or giving `InsightsPanel` access to the refresh signal.

### 14. Theme flash on initial page load (LOW)

**File:** `frontend/src/components/layout/ThemeProvider.tsx:18`

```tsx
const [theme, setThemeState] = useState<Theme>("light");
```

The initial state is always `"light"`, and the `useEffect` reads `localStorage` / `prefers-color-scheme` on mount. Users with dark mode preference will see a brief flash of light mode. Consider reading the stored theme synchronously before rendering (e.g. via an inline `<script>` in `<head>` that sets `data-theme` before React hydrates, or using `cookies` for SSR).

### 15. Missing `response_model` on weekly review endpoints (LOW)

**File:** `backend/app/routers/weekly_review.py:19,27,37`

The weekly review router returns raw dicts from the service layer without `response_model` annotations. This means the API docs won't show response schemas, and there's no server-side response validation. The Pydantic schemas (`WeeklyReviewResponse`, `WeeklyReviewHistoryResponse`) exist but aren't used.

---

## Positive Observations

- **Clean auth flow:** Password policy validation is enforced at both the schema and service levels, bcrypt 72-byte limit is properly handled, and the lockout mechanism (while in-memory) is a good defense-in-depth measure.
- **Well-designed weekly review engine:** The priority-based action generation with anti-repeat logic is a smart approach to keeping users engaged without being repetitive.
- **Good use of CSS custom properties for theming:** The `data-theme` attribute approach with CSS variables keeps component styles clean and makes theme switching efficient.
- **Proper error handling patterns:** The global exception handler, structured validation errors, and consistent HTTP status codes make for a solid API contract.
- **Sensible database design:** UUIDs as primary keys, proper foreign key constraints, `cascade="all, delete-orphan"`, and timezone-aware timestamps are all good practices.
- **Rate limiting on auth endpoints:** 5/minute for login and 3/minute for registration are reasonable limits.
