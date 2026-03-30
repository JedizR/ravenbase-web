# Ravenbase — Current Project Status

> **Agent instruction:** Read this file at the start of every session before doing anything else.
> It tells you exactly where the project is right now.

---

## Current State

**Phase:** B — Frontend (Sprints 20–38)
**Current sprint:** 21
**Status:** In progress — 23 of 37 stories complete (Phase A backend complete, STORY-019 + STORY-020 done)

**Next story to implement:** STORY-007-FE (Sprint 22)
**Story file:** `docs/stories/EPIC-02-ingestion/STORY-007-FE.md`

---

## Last Completed Story

**STORY-020 — System Profile Switching** (2026-03-30)
Profile switching via Omnibar `/profile [name]` command (fuzzy match), sidebar dropdown (shadcn DropdownMenu), `ProfileContext` (pure client state — no API call on switch), Settings → Profiles CRUD page (create/edit/delete), Settings → AI Model selector + Notification toggles. Build: 0 TypeScript errors. Backend: `GET/POST/PATCH/DELETE /v1/profiles` + `PATCH /v1/account/model-preference` + `PATCH /v1/account/notification-preferences`.

---

## Context for Next Session

STORY-020 complete. Backend routes: `src/schemas/profile.py`, `src/api/routes/profiles.py`, `src/api/routes/account.py` (PATCH endpoints). Frontend: `contexts/ProfileContext.tsx`, `components/domain/ProfileSwitcher.tsx`, `components/domain/Sidebar.tsx`, `components/domain/MobileSidebar.tsx`, `components/domain/Omnibar.tsx`, `components/domain/DashboardHeader.tsx`, `app/(dashboard)/settings/page.tsx`, `app/(dashboard)/settings/profiles/page.tsx`. Omnibar uses cmdk Command; profile switching is pure `setActiveProfile()` with toast confirmation. Next story is STORY-007-FE (Sprint 22 — Omnibar UI + IngestionProgress component).

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
