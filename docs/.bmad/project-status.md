# Ravenbase — Current Project Status

> **Agent instruction:** Read this file at the start of every session before doing anything else.
> It tells you exactly where the project is right now.

---

## Current State

**Phase:** B — Frontend (Sprints 20–38)
**Current sprint:** 21
**Status:** In progress — 22 of 37 stories complete (Phase A backend complete, STORY-019 done)

**Next story to implement:** STORY-020
**Story file:** `docs/stories/EPIC-06-auth-profiles/STORY-020.md`

---

## Last Completed Story

**STORY-019 — Onboarding Wizard** (2026-03-30)
3-step onboarding wizard at `/onboarding`: StepProfile (role + profile name), StepUpload (IngestionDropzone + textarea paste), StepProgress (SSE stream via `useSSE` hook). Register page now redirects to `/onboarding` after sign-up. Build: 0 TypeScript errors.

---

## Context for Next Session

STORY-019 complete. Onboarding wizard fully wired: `app/(auth)/onboarding/page.tsx`, `components/domain/OnboardingWizard.tsx`, `components/domain/IngestionDropzone.tsx`, `hooks/use-sse.ts`. SSE connects to `/v1/ingest/stream/{source_id}?token=` (backend STORY-007-BE). Backend `POST /v1/users/me/complete-onboarding` and `GET /v1/users/me` endpoints are called with graceful error handling if not yet deployed. Next story is STORY-020.

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
