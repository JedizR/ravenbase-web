# Ravenbase — Current Project Status

> **Agent instruction:** Read this file at the start of every session before doing anything else.
> It tells you exactly where the project is right now.

---

## Current State

**Phase:** B — Frontend (Sprints 20–38)
**Current sprint:** 31
**Status:** In progress — 33 of 38 stories complete (Phase A backend complete, STORY-018-FE, STORY-019, STORY-020, STORY-007-FE, STORY-008-FE, STORY-017, STORY-027, STORY-028-FE, STORY-011, STORY-014, STORY-030, STORY-021, STORY-022 done)

**Next story to implement:** STORY-031 (Sprint 31 — Dark mode toggle)
**Story file:** `docs/stories/EPIC-08-polish/STORY-031.md`

---

## Last Completed Story

**STORY-022 — Pricing Page + Stripe Checkout (Sprint 30)** (2026-03-31)
Public `/pricing` page with Free/Pro/Team tier cards, monthly/annual toggle, feature comparison table. Stripe Checkout session created server-side. Redis-idempotent webhook handler upgrades `User.tier` on `checkout.session.completed` and reverts to free on `customer.subscription.deleted`. Settings → Billing page with Customer Portal link. Build passes, 0 TypeScript errors.

---

## Context for Next Session

STORY-022 complete. Pricing page at `app/(marketing)/pricing/page.tsx` (Server Component, SSG). PricingSection and PricingToggle in `components/marketing/`. Billing settings at `app/(dashboard)/settings/billing/page.tsx`. CheckoutSuccessHandler at `components/dashboard/CheckoutSuccessHandler.tsx` — listens for `?checkout=success` and fires toast. Marketing layout now includes QueryClientProvider (added to fix build error). Backend: `src/api/routes/billing.py` (create-checkout-session, create-portal-session), `src/services/billing_service.py`, `src/api/routes/webhooks.py` upgraded with Redis idempotency. API client regenerated after STORY-022.

---

## Backend Gate Checklist

Complete these before starting Phase B (frontend):

- [x] All backend stories merged to main — STORY-037 is last entry in `git log --oneline docs/stories/epics.md`
- [x] `make test` passes from clean checkout — 333 passed, 0 failures (2026-03-29)
- [x] `make quality` passes — 0 ruff errors, 0 pyright errors, 145 files formatted (2026-03-29)
- [x] `npm run generate-client` in ravenbase-web produces a non-empty `src/lib/api-client/` — ✅ 9 files generated (types.gen.ts, services.gen.ts, schemas.gen.ts, core/) (2026-03-30); fixed `--client axios` → `legacy/axios` (openapi-ts v0.53 API change)
- [x] `curl localhost:8000/health` responds — redis: ok; postgresql/qdrant/neo4j: error (cloud services unavailable in local dev; postgres + redis containers healthy per `docker compose ps`)

---

## How to Update This File

After every completed story, update the three fields above:
- **Current sprint** → increment by 1
- **Next story to implement** → next 🔲 row in `docs/stories/epics.md`
- **Last Completed Story** → the story you just finished + one sentence of what was built
- **Context for Next Session** → anything useful to know before starting the next story

**Also update `docs/.bmad/journal.md`** — append one entry for the completed story
following the template at the top of that file. This is mandatory and part of the same
commit (see `DEVELOPMENT_LOOP.md` → Step 9).

The agent that completes each story is responsible for updating all three docs files
as part of the final commit step (see `DEVELOPMENT_LOOP.md` → Post-Story Commit Template).

---

## Session Notes (freehand)

_Use this section for anything that doesn't fit the structure above:
blockers encountered, decisions made, deferred issues, environment quirks._

Brand color fix and UX quality gates added to all remaining stories STORY-031
through STORY-036. STORY-038 created as final polish story. Total stories
increased from 37 to 38.
