# STORY-035: Data Export / Right to Portability

**Epic:** EPIC-08 — Polish & Production Hardening
**Priority:** P1
**Complexity:** Medium
**Depends on:** STORY-024 (same multi-store pattern), STORY-032 (email service)

---

## Functional Requirements
<!-- Which FR acceptance criteria does this story satisfy? -->
None — data export / right to portability story.

## Component
COMP-07: PrivacyLayer

---

> **Before You Start — Read These Files First:**
> 1. `CLAUDE.md` — architecture rules (3-layer, ARQ, structlog)
> 2. `docs/architecture/02-database-schema.md` — all models being exported
> 3. `docs/stories/EPIC-08-polish/STORY-024.md` — GDPR deletion (same multi-store approach)
> 4. `docs/stories/EPIC-08-polish/STORY-032.md` — email service (send completion email)

---

## User Story
As a user, I want to download all my Ravenbase data in a portable format so I can
take my knowledge graph elsewhere or simply have a backup.

## Context
- GDPR Article 20 (Right to Data Portability) for EU users
- Export is async ARQ job — files can be very large
- Completion notification via Resend email
- Download link = pre-signed Supabase Storage URL (72-hour expiry)
- Rate limited: 1 export per 24 hours per user

## Acceptance Criteria
- [ ] AC-1: `POST /v1/account/export` returns `202` with `job_id` and enqueues ARQ task
- [ ] AC-2: Rate limit: second request within 24h returns `429` with `retry_after_seconds`
- [ ] AC-3: ARQ task collects: original source files, Meta-Documents as `.md`, Neo4j graph as JSON, SystemProfiles as JSON
- [ ] AC-4: All files compressed into ZIP at `exports/{user_id}/{timestamp}.zip` in Supabase Storage
- [ ] AC-5: Pre-signed download URL generated (72-hour expiry)
- [ ] AC-6: Completion email sent via `EmailService` with download link (respects `notify_ingestion_complete` preference)
- [ ] AC-7: `GET /v1/account/export/status` returns current status and URL
- [ ] AC-8: Settings → Data page has "Export my data" button + "last exported" timestamp
- [ ] AC-9: If any single component fails (e.g. Neo4j export errors): log error, skip that component, complete ZIP with `PARTIAL_EXPORT.txt` explaining what was excluded — never fail the whole job
- [ ] AC-10: Export ZIPs auto-deleted from Supabase Storage after 7 days

## Technical Notes

### Files to Create
- `src/workers/tasks/export.py` — `generate_user_export` ARQ task
- `src/services/export_service.py`

### Architecture Constraints
- Filter ALL queries by `tenant_id` — never include other users' data
- Never include raw Qdrant vectors (derived data, not user data per GDPR)
- Partial failures are non-fatal — produce `PARTIAL_EXPORT.txt` not a failed job
- Rate limit via Redis key `export:cooldown:{user_id}` TTL 24h
- Store only `storage_path` in JobStatus (URL is ephemeral, regenerated on status check)
- Export idempotency: if ZIP already exists at `storage_path`, skip recreation (for ARQ retries)

## UX & Visual Quality Requirements

### Settings → Data Page UX
1. Page header:
   - h1: font-serif text-3xl "Your Data"
   - Subtitle: text-sm text-muted-foreground "Download everything you've stored in Ravenbase."
   - Mono label: ◆ DATA_PORTABILITY

2. Format selector (before export button):
   Three format cards side by side (or stacked on mobile):
   - JSON (default): "Complete structured data, machine-readable"
   - CSV: "Spreadsheet-compatible, sources and memories only"
   - ZIP: "Everything including original uploaded files"

   Each card: bg-card rounded-2xl border p-4 cursor-pointer
   Selected: border-2 border-primary bg-primary/5
   Icon per format: File (JSON), Table (CSV), Archive (ZIP) from lucide-react

3. File size estimate below format selector:
   - text-xs font-mono text-muted-foreground
   - Shows: "Estimated size: ~X MB" based on user's source count
   - Fetched from GET /v1/users/me or estimated client-side

4. Export button states:
   - Idle: "◆ EXPORT_DATA" — rounded-full bg-primary text-primary-foreground h-11 w-full
   - Loading: spinner + "Preparing export..."
   - Progress (if large): forest green determinate progress bar (0→100%)
   - Success: "◆ EXPORT_READY" + download link button
   - Error: toast.error("Export failed. Try again or contact support.")

5. Success state after export:
   - Green checkmark animation (SVG check-draw from globals.css)
   - "Your data is ready" heading in font-serif
   - "Download expires in 24 hours" in text-xs text-muted-foreground
   - Download button: rounded-full bg-success text-success-foreground

6. "Delete all data" section (GDPR):
   - Separated from export section by <Separator />
   - Section header: ◆ DANGER_ZONE in text-destructive mono
   - "Delete my account and all data" button:
     rounded-full border border-destructive text-destructive
     hover:bg-destructive hover:text-destructive-foreground
   - Opens AlertDialog (not inline) with:
     - Warning: "This permanently deletes your account, knowledge graph,
       and all uploaded files. This cannot be undone."
     - Confirmation input: user must type "DELETE" before button enables
     - Delete button: rounded-full bg-destructive text-destructive-foreground

## Definition of Done
- [ ] `POST /v1/account/export` returns 202 with job_id
- [ ] ZIP created in Supabase Storage with all 4 components
- [ ] Partial failures produce PARTIAL_EXPORT.txt (job does not fail)
- [ ] Email sent with download link
- [ ] Rate limit enforced (24h cooldown)
- [ ] `make quality && make test` passes

## Final Localhost Verification (mandatory before marking complete)

After `make quality && make test` passes, verify the running application works:

**Step 1 — Start dev server:**
```bash
cd ravenbase-api && make run
```

**Step 2 — Verify no runtime errors:**
- Test the export endpoint with curl or a tool like Postman
- Confirm no unhandled exceptions in server logs
- Confirm structlog output is clean

**Step 3 — Report one of:**
- ✅ `localhost verified` — export service runs correctly
- ⚠️ `Issue found: [describe issue]` — fix before committing docs

Only commit the docs update (epics.md, story-counter, project-status, journal) AFTER localhost verification passes.

## Testing This Story

```bash
# Test data export flow end-to-end:
# 1. POST /v1/account/export → expect 202 with job_id
# 2. Poll GET /v1/account/export/status until status = "completed"
# 3. Verify download_url is a Supabase pre-signed URL (contains "supabase.co")
# 4. Download the ZIP and verify it contains:
#    - sources/ directory (original uploaded files)
#    - meta_documents/ directory (.md files)
#    - graph_export.json
#    - profiles.json
#    - README.txt
# 5. POST /v1/account/export again immediately → expect 429 with retry_after_seconds
# 6. Verify export ZIP contains ONLY this user's data (check no other tenant_id present)
# 7. Partial failure test: mock Neo4j adapter to raise an exception → verify job still
#    completes with PARTIAL_EXPORT.txt listing "Knowledge Graph: <error message>"
# 8. Verify download_url expires after 72 hours (check Supabase signed URL expiry param)
```

## Frontend Agent Brief

```
Implement STORY-035 Frontend: Settings → Data Page (Export + Delete Account).

This is the FRONTEND PART ONLY. The backend (ARQ export job, ZIP creation, email
notification) must be implemented in ravenbase-api first.

Read FIRST — read every file listed below completely before writing any code:
1. CLAUDE.md (all 19 frontend rules)
2. docs/design/AGENT_DESIGN_PREAMBLE.md — NON-NEGOTIABLE visual rules.
   Anti-patterns to REJECT:
   - Hardcoded hex colors (use CSS variables only)
   - Rounded-lg on cards (use rounded-2xl)
   - rounded-md on primary CTAs (use rounded-full)
   - Using <form> tags (use onClick + controlled state)
3. docs/design/00-brand-identity.md — brand colors, mono labels, ◆ SECTION pattern
4. docs/design/01-design-system.md — all color tokens, typography
5. docs/design/CLAUDE_FRONTEND.md — API client usage (useApiFetch, TanStack Query)
6. docs/architecture/03-api-contract.md — POST /v1/account/export, GET /v1/account/export/status
7. docs/stories/EPIC-08-polish/STORY-035.md (this file — frontend ACs 8-10)

SPECIFIC IMPLEMENTATION STEPS:

Step 1 — Create app/(dashboard)/settings/data/page.tsx:

LAYOUT STRUCTURE:
<div className="space-y-8">
  {/* Export section */}
  <section>
    <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">◆ DATA_PORTABILITY</p>
    <h1 className="font-serif text-3xl mb-2">Your Data</h1>
    <p className="text-sm text-muted-foreground mb-6">
      Download everything you've stored in Ravenbase.
    </p>

    {/* Format selector — 3 cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {formats.map(f => (
        <div
          key={f.id}
          onClick={() => setSelectedFormat(f.id)}
          className={cn(
            "bg-card rounded-2xl border p-4 cursor-pointer transition-all",
            selectedFormat === f.id
              ? "border-2 border-primary bg-primary/5"
              : "border border-border hover:border-primary/50"
          )}
        >
          <f.icon className="w-5 h-5 mb-2 text-primary" />
          <p className="font-medium text-sm">{f.label}</p>
          <p className="text-xs text-muted-foreground">{f.description}</p>
        </div>
      ))}
    </div>

    {/* Export button */}
    {exportStatus === "idle" && (
      <button
        onClick={handleExport}
        className="w-full h-11 rounded-full bg-primary text-primary-foreground
                   font-medium flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        ◆ EXPORT_DATA
      </button>
    )}

    {exportStatus === "loading" && (
      <button disabled className="w-full h-11 rounded-full ...">
        <Loader2 className="w-4 h-4 animate-spin" />
        Preparing export...
      </button>
    )}

    {exportStatus === "progress" && (
      <div className="space-y-2">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300"
               style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground text-center">Preparing export... {progress}%</p>
      </div>
    )}

    {exportStatus === "ready" && downloadUrl && (
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="font-serif text-lg">Your data is ready</p>
        </div>
        <p className="text-xs font-mono text-muted-foreground">
          Download expires in 24 hours
        </p>
        <a
          href={downloadUrl}
          download
          className="w-full h-11 rounded-full bg-success text-success-foreground
                     font-medium flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download ZIP
        </a>
      </div>
    )}
  </section>

  {/* Danger zone — DELETE ACCOUNT */}
  <Separator />
  <section>
    <p className="text-xs font-mono text-destructive tracking-wider mb-2">◆ DANGER_ZONE</p>

    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="w-full h-11 rounded-full border border-destructive
                           text-destructive font-medium
                           hover:bg-destructive hover:text-destructive-foreground
                           transition-colors">
          Delete my account and all data
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account, knowledge graph,
            and all uploaded files. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* AC-10: Confirmation input — user must type "DELETE" */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Type <span className="font-mono text-destructive">DELETE</span> to confirm
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className={confirmText === "DELETE" ? "border-success" : ""}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmText !== "DELETE"}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete my account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>
</div>

Step 2 — API integration:
POST /v1/account/export → 202 { job_id: string }
GET /v1/account/export/status → { status: "queued" | "preparing" | "ready" | "failed", download_url?: string, progress?: number }

Use useMutation for the export trigger:
const exportMutation = useMutation({
  mutationFn: () => apiFetch<ExportResponse>("/v1/account/export", { method: "POST" }),
  onSuccess: (data) => {
    queryClient.setQueryData(["export-status", data.job_id], data)
    // Start polling
  },
})

Use useQuery with refetchInterval for status polling:
const { data: status } = useQuery({
  queryKey: ["export-status", jobId],
  queryFn: () => apiFetch<ExportStatusResponse>(`/v1/account/export/status?job_id=${jobId}`),
  enabled: !!jobId,
  refetchInterval: (q) => q.state.data?.status === "ready" ? false : 3000,
})

Step 3 — File size estimate:
AC-8: "Estimated size: ~X MB"
This can be estimated client-side based on known limits:
- JSON: ~50KB base + ~1KB per source + ~0.5KB per memory node
- Or fetch from GET /v1/account/export/size-estimate if that endpoint exists

Step 4 — Loading state:
Remember RULE 10: every async dashboard page needs loading.tsx sibling.
Create app/(dashboard)/settings/data/loading.tsx:
import { Skeleton } from "@/components/ui/skeleton"
export default function DataSettingsLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  )
}

WHAT NOT TO DO:
- DO NOT use <form> tag — use controlled div + onClick
- DO NOT use rounded-lg on cards — use rounded-2xl
- DO NOT use rounded-md on CTAs — use rounded-full
- DO NOT skip loading.tsx sibling
- DO NOT delete account without requiring "DELETE" confirmation

AC CHECKLIST:
□ Format selector: 3 cards, selected card has border-2 border-primary
□ Export button: "◆ EXPORT_DATA" rounded-full bg-primary
□ Loading state: spinner + "Preparing export..."
□ Progress bar: forest green fill, shows percentage
□ Success state: ◆ EXPORT_READY + download link + 24h expiry notice
□ Error state: toast.error with message
□ Delete section: ◆ DANGER_ZONE in text-destructive mono
□ AlertDialog: requires "DELETE" typed before delete button enables
□ loading.tsx sibling exists
□ Mobile: format cards stack vertically (grid-cols-1 on mobile)

Show plan first. Do not implement yet.
```

## Development Loop
Follow `docs/DEVELOPMENT_LOOP.md`.
```bash
make quality && make test
git add -A && git commit -m "feat(ravenbase): STORY-035 data export and portability"
```
