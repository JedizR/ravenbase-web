# Ravenbase — Current Project Status

> **Agent instruction:** Read this file at the start of every session before doing anything else.
> It tells you exactly where the project is right now.

---

## Current State

**Phase:** B — Frontend (Sprints 20–38)
**Current sprint:** 33
**Status:** In progress — 36 of 38 stories complete (Phase A backend complete, STORY-018-FE, STORY-019, STORY-020, STORY-007-FE, STORY-008-FE, STORY-017, STORY-027, STORY-028-FE, STORY-011, STORY-014, STORY-030, STORY-021, STORY-022, STORY-031, STORY-032, STORY-033 done)

**Next story to implement:** STORY-034 (Sprint 34 — Referral system: code gen, reward on first upload, Settings → Referrals)
**Story file:** `docs/stories/EPIC-08-polish/STORY-034.md`

---

## Last Completed Story

**STORY-033 — Legal Pages (Sprint 33)** (2026-04-02)
All legal pages and cookie consent were built in prior sprints as part of STORY-021 and other marketing work. Privacy Policy (`/privacy`) and Terms of Service (`/terms`) render at static routes with correct semantic HTML structure, metadata exports, and sitemap inclusion. Footer has `<nav aria-label="Legal navigation">` with links to both pages. CookieConsent component (`components/marketing/CookieConsent.tsx`) conditionally shows if `NEXT_PUBLIC_POSTHOG_KEY` is set, stores consent in localStorage, and has Accept/Decline buttons with Privacy Policy link. Build passes, 0 TypeScript errors.

---

## Context for Next Session

STORY-033 complete (verified all 8 ACs met by existing implementation). CookieConsent future-proofed for PostHog integration. No code changes needed. Next: STORY-034 (referral system).

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
