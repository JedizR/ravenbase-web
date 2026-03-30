# Ravenbase — Current Project Status

> **Agent instruction:** Read this file at the start of every session before doing anything else.
> It tells you exactly where the project is right now.

---

## Current State

**Phase:** B — Frontend (Sprints 20–38)
**Current sprint:** 22
**Status:** In progress — 24 of 37 stories complete (Phase A backend complete, STORY-019, STORY-020, STORY-007-FE done)

**Next story to implement:** STORY-008-FE (Sprint 22)
**Story file:** `docs/stories/EPIC-02-ingestion/STORY-008.md`

---

## Last Completed Story

**STORY-007-FE — IngestionProgress Component** (2026-03-30)
Real-time SSE progress bar via useSSE hook, Progress/Skeleton, complete/error/connecting states, aria-live region, CheckCircle2/XCircle icons.

---

## Context for Next Session

STORY-007-FE complete. `hooks/use-sse.ts` updated to accept `progress_pct` fallback. `components/domain/IngestionProgress.tsx` created with real-time SSE progress bar (Progress + Skeleton), complete/error/connecting states, aria-live region, CheckCircle2/XCircle icons. Next story is STORY-008-FE (Sprint 22 — Omnibar text quick-capture UI).

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
