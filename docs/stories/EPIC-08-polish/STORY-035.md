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

> **Skill Invocations — invoke each skill before the corresponding phase:**
>
> **Phase 1 (Read/Design):** `Use /frontend-design — enforce production-grade aesthetic compliance`
> **Phase 2 (Components):** `Use /tailwindcss — for Tailwind CSS v4 token system`
> **Phase 3 (State Management):** `Use /tailwindcss-animations — for loading/progress animations`
> **Phase 4 (Verification):** `Use /superpowers:verification-before-completion — before claiming done`

---

```
🎯 Target: Claude Code / MiniMax-M2.7 — Ultra-detailed planning and implementation
💡 Optimization: MiniMax-M2.7 directive — WRITE EVERYTHING IN MAXIMUM DETAIL.
   Plans MUST be 1500-3000 lines. Never short-circuit with "see code below".

═══════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════

This story has a BACKEND PART and a FRONTEND PART.

Backend (AC-1 through AC-7): ARQ job, ZIP creation, Supabase Storage, email notification.
Frontend (AC-8 through AC-10): Settings → Data page with export + delete account.

Frontend ACs:
- AC-8: Settings → Data page with export button + "last exported" timestamp
- AC-9: Delete account with AlertDialog + "DELETE" confirmation input
- AC-10: Format selector (JSON, CSV, ZIP)

Backend must provide: POST /v1/account/export, GET /v1/account/export/status.

═══════════════════════════════════════════════════════════════════
READING ORDER
═══════════════════════════════════════════════════════════════════

INVOKE: Use /frontend-design

Read ALL files. Write "✅ CONFIRMED READ: [filename]" after each:

1. CLAUDE.md — all 19 rules
2. docs/design/AGENT_DESIGN_PREAMBLE.md
3. docs/design/00-brand-identity.md
4. docs/design/01-design-system.md
5. docs/design/04-ux-patterns.md
6. docs/stories/EPIC-08-polish/STORY-035.md (this file — all ACs)

═══════════════════════════════════════════════════════════════════
PAGE DESIGN — full code for app/(dashboard)/settings/data/page.tsx
═══════════════════════════════════════════════════════════════════

"use client"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface ExportStatus {
  status: "idle" | "queued" | "preparing" | "ready" | "failed"
  job_id?: string
  download_url?: string
  progress?: number
}

const formats = [
  {
    id: "json",
    label: "JSON",
    description: "Complete structured data, machine-readable",
    icon: "FileText",
  },
  {
    id: "csv",
    label: "CSV",
    description: "Spreadsheet-compatible, sources and memories only",
    icon: "Table",
  },
  {
    id: "zip",
    label: "ZIP",
    description: "Everything including original uploaded files",
    icon: "Archive",
  },
]

export default function DataSettingsPage() {
  const [selectedFormat, setSelectedFormat] = useState<"json" | "csv" | "zip">("json")
  const [confirmText, setConfirmText] = useState("")
  const queryClient = useQueryClient()

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ job_id: string }>("/v1/account/export", {
        method: "POST",
        body: JSON.stringify({ format: selectedFormat }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["export-status"], {
        status: "queued",
        job_id: data.job_id,
      } as ExportStatus)
      toast.success("Export started. We'll email you when it's ready.")
    },
    onError: () => {
      toast.error("Export failed. Please try again or contact support.")
    },
  })

  // Poll export status
  const { data: exportStatus } = useQuery<ExportStatus>({
    queryKey: ["export-status"],
    queryFn: async () => {
      const jobId = queryClient.getQueryData<{ job_id: string }>(["export-mutation"])?.job_id
      if (!jobId) throw new Error("No job ID")
      return apiFetch<ExportStatus>(
        `/v1/account/export/status?job_id=${jobId}`
      )
    },
    enabled: !!exportMutation.data?.job_id,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      return status === "ready" || status === "failed" ? false : 3000
    },
  })

  const isExporting =
    exportStatus?.status === "queued" || exportStatus?.status === "preparing"
  const canDownload = exportStatus?.status === "ready"
  const progress = exportStatus?.progress ?? 0

  const handleDeleteAccount = async () => {
    // Backend handles full deletion flow
    toast.success("Account deletion initiated. You'll receive a confirmation email.")
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Export section */}
      <section>
        <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">
          ◆ DATA_PORTABILITY
        </p>
        <h1 className="font-serif text-3xl mb-2">Your Data</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Download everything you have stored in Ravenbase.
        </p>

        {/* Format selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFormat(f.id as typeof selectedFormat)}
              className={`
                bg-card rounded-2xl border p-4 text-left cursor-pointer
                transition-all hover:shadow-md
                ${selectedFormat === f.id
                  ? "border-2 border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
                }
              `}
            >
              <p className="font-medium text-sm mb-1">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.description}</p>
            </button>
          ))}
        </div>

        {/* Export button states */}
        {exportStatus?.status === "idle" && (
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground
                       font-medium flex items-center justify-center gap-2
                       disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            ◆ EXPORT_DATA
          </button>
        )}

        {isExporting && (
          <div className="space-y-2">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Preparing export... {progress}%
            </p>
          </div>
        )}

        {canDownload && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <p className="font-serif text-lg">Your data is ready</p>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              Download expires in 24 hours
            </p>
            <a
              href={exportStatus.download_url}
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
        <p className="text-xs font-mono text-destructive tracking-wider mb-2">
          ◆ DANGER_ZONE
        </p>

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

            {/* AC-10: Confirmation input */}
            <div className="space-y-2">
              <label htmlFor="delete-confirm" className="text-sm font-medium">
                Type{" "}
                <span className="font-mono text-destructive">DELETE</span>{" "}
                to confirm
              </label>
              <Input
                id="delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className={
                  confirmText === "DELETE"
                    ? "border-success focus:border-success"
                    : ""
                }
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={confirmText !== "DELETE"}
                className="bg-destructive text-destructive-foreground
                           hover:bg-destructive/90 disabled:opacity-50"
              >
                Delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}

═══════════════════════════════════════════════════════════════════
LOADING STATE — required (RULE 10)
═══════════════════════════════════════════════════════════════════

FILE: app/(dashboard)/settings/data/loading.tsx

import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function DataSettingsLoading() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-full" />
      <Separator />
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  )
}

═══════════════════════════════════════════════════════════════════
ANTI-PATTERNS
═══════════════════════════════════════════════════════════════════

❌ <form> tag → use onClick + controlled state
❌ rounded-lg on cards → must be rounded-2xl
❌ rounded-md on CTAs → must be rounded-full
❌ DELETE button without confirmation input → AC-10 requires typed DELETE
❌ No loading.tsx sibling → required for every async dashboard page
❌ useState+useEffect for API data → use useQuery + useMutation

═══════════════════════════════════════════════════════════════════
SUCCESS CRITERIA
═══════════════════════════════════════════════════════════════════

INVOKE: Use /superpowers:verification-before-completion

✅ Format selector: 3 cards, selected has border-2 border-primary
✅ Export button: "◆ EXPORT_DATA" rounded-full bg-primary
✅ Loading state: progress bar shows percentage
✅ Success state: "◆ EXPORT_READY" + download link + 24h expiry notice
✅ Error state: toast.error message
✅ Delete section: ◆ DANGER_ZONE in text-destructive mono
✅ AlertDialog: requires "DELETE" typed before button enables
✅ Delete button: disabled unless confirmText === "DELETE"
✅ loading.tsx sibling exists
✅ TanStack Query: useMutation for export trigger, useQuery for status polling
✅ npm run build passes

Show plan first. Do not implement yet.
```

## Development Loop
Follow `docs/DEVELOPMENT_LOOP.md`.
```bash
make quality && make test
git add -A && git commit -m "feat(ravenbase): STORY-035 data export and portability"
```
