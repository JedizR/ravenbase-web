# COMP-06: CreditSystem

> **Component ID:** BE-COMP-06
> **Epic:** EPIC-08 — Polish & Production Hardening
> **Stories:** STORY-023
> **Type:** Backend (with frontend balance display)

---

## Goal

The CreditSystem owns per-operation credit deduction with ledger tracking. It ensures atomic credit balance updates (no race conditions), provides a balance inquiry endpoint, integrates with Stripe webhooks for top-ups, and enforces pre-operation credit checks. Every LLM and storage operation in the system flows through this component.

---

## Product Requirements

1. **Credit Transaction Ledger:** Every credit change (deduction or addition) creates a `CreditTransaction` record: `user_id`, `amount` (positive or negative), `operation`, `balance_after`, `created_at`.

2. **Atomic Deduction:** `CreditService.deduct()` uses `SELECT FOR UPDATE` to prevent race conditions when concurrent operations deduct credits simultaneously.

3. **Credit Costs (per `prd/05-monetization.md`):**
   - Ingestion: 1 credit per page
   - Meta-Doc (Claude Haiku): 18 credits
   - Meta-Doc (Claude Sonnet): 45 credits
   - Chat (Claude Haiku): 3 credits
   - Chat (Claude Sonnet): 8 credits
   - NL Graph Query: 2 credits
   - Free signup bonus: +500 credits
   - Referral signup bonus: +200 credits
   - Referral reward (first upload): +200 credits

4. **Balance Check Before Operation:** Before any paid operation (Meta-Doc, Chat, NL query), the system checks `user.credits_balance >= estimated_credits` and returns `402 INSUFFICIENT_CREDITS` if insufficient — BEFORE any LLM call or job enqueue.

5. **Deduct After Success:** Credits are deducted AFTER successful operation completion, not before. If an operation fails, no deduction occurs.

6. **Balance Endpoint:** `GET /v1/credits/balance` returns `{balance, transactions: [...]}` with recent transactions.

7. **Stripe Top-Up:** `POST /webhooks/stripe` handles `checkout.session.completed` to add credits from purchased top-up packs.

8. **Sidebar Display:** Frontend shows credit balance in sidebar footer.

---

## Criteria and Tests

| Criterion | Test |
|---|---|
| Credits deducted for all operations | Complete operation → SELECT * FROM credit_transactions WHERE user_id = X |
| Race condition: concurrent deductions | 10 simultaneous requests → balance = initial - (10 × cost) |
| Pre-operation 402 check | Set balance to 0 → call generate → 402 before any work |
| Deduct after success | Complete generation → check balance decreased |
| Stripe webhook adds credits | Trigger checkout.session.completed → balance increased |
| Free signup +500 bonus | New user created → credit_transaction with operation=signup_bonus |
| Referral signup +200 | Referral code used on signup → +200 credits |
| Referral first upload +200 | Referee uploads first file → referrer gets +200 |
| Balance endpoint returns transactions | GET /v1/credits/balance → includes recent transactions |

---

## Related Stories

| Story | Title | Type | Description |
|---|---|---|---|
| [STORY-023](../stories/EPIC-08-polish/STORY-023.md) | Credits System | Backend | Deduct, ledger, 402 check, Stripe webhook |

---

## Subcomponents

The CreditSystem has 1 subcomponent covering the full credit lifecycle.

---

### SUBCOMP-06A: Credit Lifecycle

**Stories:** STORY-023
**Files:** `src/services/credit_service.py`, `src/api/routes/credits.py`, `src/api/routes/webhooks.py`, `src/models/credit_transaction.py`, `alembic/versions/XXX_add_credit_transactions.py`, `tests/integration/api/test_credits.py`

#### Details
The CreditService manages the complete credit lifecycle: atomic deductions with `SELECT FOR UPDATE` locking, balance checks before paid operations, the `CreditTransaction` ledger, and the Stripe webhook handler for top-ups. Every component that calls an LLM or storage API integrates with this service.

#### Criteria of Done
- [ ] `CreditTransaction` model: `user_id`, `amount`, `operation`, `balance_after`, `created_at`
- [ ] `deduct(db, user_id, amount, operation)` uses `SELECT FOR UPDATE` — no race conditions
- [ ] `check_or_raise(db, user_id, amount)` raises 402 if insufficient — called BEFORE operation
- [ ] `add_credits(db, user_id, amount, operation)` for top-ups and bonuses
- [ ] All 8 credit costs correctly defined as constants
- [ ] `GET /v1/credits/balance` returns `{balance, transactions: [...]}` (last 20)
- [ ] Stripe `checkout.session.completed` webhook adds credits with correct metadata
- [ ] Free signup: 500 credits via `signup_bonus` transaction
- [ ] Referral bonuses: +200 on signup via referral, +200 to referrer on first upload
- [ ] Concurrent deduction test: 10 simultaneous → exact expected balance

#### Checklist
- [ ] `SELECT FOR UPDATE` on `User` row before decrementing balance
- [ ] `CreditTransaction` record created in same transaction as balance update
- [ ] `balance_after` field records balance immediately after this transaction
- [ ] 402 raised BEFORE any expensive operation (LLM call, job enqueue)
- [ ] `deduct()` called AFTER generation/chat success (not before)
- [ ] Stripe webhook: `checkout.session.completed` reads `metadata.user_id` and `metadata.credits`
- [ ] Stripe signature validated: `stripe.Webhook.construct_event()`
- [ ] Credit cost constants: `INGESTION_PER_PAGE = 1`, `META_DOC_HAIKU = 18`, etc.
- [ ] Alembic migration for `credit_transactions` table
- [ ] Integration test for concurrent deductions

#### Testing
```bash
# Balance endpoint:
curl http://localhost:8000/v1/credits/balance \
  -H "Authorization: Bearer TOKEN"
# Expected: {"balance": 500, "transactions": [{"operation": "signup_bonus", "amount": 500, ...}]}

# 402 insufficient credits:
# Set user balance to 0 via psql: UPDATE users SET credits_balance = 0 WHERE id = 'user_id'
curl -X POST http://localhost:8000/v1/metadoc/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "model": "haiku"}'
# Expected: 402 {"detail": {"code": "INSUFFICIENT_CREDITS"}}

# Concurrent deductions:
uv run pytest tests/integration/api/test_credits.py::test_concurrent_deductions -v
# Expected: exact balance after 10 concurrent deductions

# Stripe webhook (use Stripe CLI):
stripe listen --forward-to http://localhost:8000/webhooks/stripe
stripe trigger checkout.session.completed
# Check: psql -c "SELECT * FROM credit_transactions WHERE operation = 'stripe_topup'"

make quality
```
