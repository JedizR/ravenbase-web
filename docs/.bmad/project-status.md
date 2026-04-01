# Ravenbase — Current Project Status

> **Agent instruction:** Read this file at the start of every session before doing anything else.
> It tells you exactly where the project is right now.

---

## Current State

**Phase:** B — Frontend (Sprints 20–38)
**Current sprint:** 32
**Status:** In progress — 35 of 38 stories complete (Phase A backend complete, STORY-018-FE, STORY-019, STORY-020, STORY-007-FE, STORY-008-FE, STORY-017, STORY-027, STORY-028-FE, STORY-011, STORY-014, STORY-030, STORY-021, STORY-022, STORY-031, STORY-032 done)

**Next story to implement:** STORY-033 (Sprint 33 — Legal pages: Privacy Policy, Terms of Service, Cookie Consent)
**Story file:** `docs/stories/EPIC-08-polish/STORY-033.md`

---

## Last Completed Story

**STORY-032 — Transactional Email via Resend (Sprint 32)** (2026-04-02)
Backend: EmailService with send_welcome, send_low_credits, send_ingestion_complete methods + HTML email templates. API endpoints: GET /v1/account/notification-preferences, POST /v1/account/notification-prefs/test/{type}. Frontend: dedicated /settings/notifications page with ToggleRow and EmailPreviewCard components. Build passes, 0 TypeScript errors.

---

## Context for Next Session

STORY-032 complete. Backend: EmailService + notification-preferences API endpoints. Frontend: /settings/notifications page with TanStack Query mutations. MetaDocHistory fix for direct list response. Next: STORY-033 (legal pages: Privacy Policy, Terms of Service, Cookie Consent).

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
