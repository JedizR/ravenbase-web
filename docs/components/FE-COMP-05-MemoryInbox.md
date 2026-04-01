# MemoryInbox

> **Component ID:** FE-COMP-05
> **Epic:** EPIC-04 — Conflict Detection & Memory Inbox
> **Stories:** STORY-014
> **Type:** Frontend (Dashboard)

---

## Goal

The Memory Inbox is Ravenbase's signature differentiator — a keyboard-first interface for resolving contradictory facts surfaced by the Conflict Detection Agent. Memory is never silently overwritten; users explicitly approve or reject AI-proposed resolutions. The inbox handles three resolution flows (Binary Triage, Conversational, Auto-resolved) and is designed to clear all pending conflicts in under 60 seconds.

---

## Product Requirements

1. **Inbox Route:** Accessible at `/dashboard/inbox`. Shows pending conflicts sorted by confidence (highest first). Empty when no conflicts exist.

2. **Flow 1 — Binary Triage:** Central conflict card. `J`/`K` navigate between cards. `Enter` accepts AI resolution (ACCEPT_NEW). `Backspace` rejects challenger (KEEP_OLD). All with < 200ms UI update via optimistic updates.

3. **Flow 2 — Conversational Clarification:** Press `C` on any card to expand inline chat. User types custom resolution text. `Enter` sends to `POST /v1/conflicts/{id}/resolve` with `action=CUSTOM`. `Esc` cancels.

4. **Flow 3 — Auto-Resolved with Undo:** Low-authority-gap conflicts auto-resolve server-side. Client shows a sonner toast: "Updated [resolution]. Undo?" with 30-second countdown. Clicking Undo calls `POST /v1/conflicts/{id}/undo`.

5. **Conflict Card Anatomy:** Shows incumbent (OLD) text in `bg-secondary/50`, challenger (NEW) in `bg-primary/10`, AI proposed resolution in `bg-accent/30`, source filenames, and confidence score badge (`bg-warning text-[var(--warning-foreground)]`).

6. **Conflict Count Badge:** Sidebar nav icon shows pending count badge. Updates in real-time via polling `GET /v1/conflicts?status=pending`.

7. **Active Card Styling:** Active/focused card: `border-2 border-primary`. Inactive cards: `border border-border opacity-70`.

8. **Optimistic UI:** Card animates out immediately on resolve. API call happens in background. On failure: card animates back in with error toast and state rollback.

9. **Empty State:** After last conflict resolved — checkmark animation with "All clear! Your knowledge graph is up to date."

10. **Keyboard Shortcut Reference:** Press `?` to show keyboard shortcut tooltip/overlay.

11. **Mobile (< 768px):** Full-width stacked cards. Action buttons expand to full-width row with `h-11` minimum tap height. Keyboard hint `<Kbd>` elements hidden (`hidden md:flex`). Swipe-right (accept) and swipe-left (reject) as progressive enhancement.

12. **Accessibility:** All keyboard shortcuts work without mouse. Focus is managed correctly when entering/exiting conversational mode.

---

## Criteria and Tests

| Criterion | Test |
|---|---|
| `/dashboard/inbox` renders conflict list | Navigate to inbox → cards display |
| J/K navigates between conflicts | Press J → next card highlighted |
| Enter accepts AI resolution | Press Enter on conflict → ACCEPT_NEW API called, card animates out |
| Backspace keeps old memory | Press Backspace → KEEP_OLD API called, card animates out |
| C expands conversational mode | Press C → card expands with chat input |
| Custom text resolves with CUSTOM action | Type text + Enter → CUSTOM resolve sent to API |
| Auto-resolved shows undo toast | Conflict auto-resolved server-side → toast with 30s countdown |
| Undo reverts resolution | Click Undo → POST /v1/conflicts/{id}/undo called |
| Sidebar badge shows count | Open inbox → badge shows pending count |
| Empty state after all resolved | Resolve last conflict → checkmark animation |
| Optimistic update reverts on failure | Disconnect network mid-resolve → card reappears + error toast |
| Mobile: full-width cards + h-11 buttons | Resize to 375px → cards stack, buttons full-width h-11 |
| Mobile: swipe gestures work | Swipe right on card → accept triggered |
| ? shows shortcut reference | Press ? → shortcut overlay appears |
| Conflict nodes pulse in graph | Conflict card → "Open in Graph" → amber pulse visible |

---

## Related Stories

| Story | Title | Type | Description |
|---|---|---|---|
| [STORY-014](docs/stories/EPIC-04-conflict/STORY-014.md) | Memory Inbox UI (Keyboard Navigation + 3 Flows) | Frontend | Inbox with all 3 resolution flows |
| [STORY-012](docs/stories/EPIC-04-conflict/STORY-012.md) | Conflict Detection Worker | Backend | Scans for contradictions after ingestion |
| [STORY-013](docs/stories/EPIC-04-conflict/STORY-013.md) | Conflict Resolution API | Backend | Resolve, undo, status endpoints |

---

## Component Files

```
components/domain/
  MemoryInbox.tsx       — Main container with keyboard handler + state machine
  ConflictCard.tsx      — Individual card (binary + expanded states)
  ConflictChat.tsx     — Inline chat for Flow 2 CUSTOM resolution
  ConflictBadge.tsx    — Sidebar count badge

hooks/
  use-keyboard-inbox.ts — J/K/Enter/Backspace/C/? keyboard handler
  use-optimistic-action.ts — Optimistic update with rollback
  useDestructiveAction.ts  — Undo toast for auto-resolve countdown

app/(dashboard)/inbox/
  page.tsx             — Inbox page layout
  loading.tsx         — Skeleton loading state
```

## State Machine

```
IDLE → (user opens inbox) → TRIAGE
TRIAGE → (J/K) → NEXT_CARD / PREV_CARD
TRIAGE → (Enter) → RESOLVING → DONE (with undo toast if auto-resolved)
TRIAGE → (C) → CHAT_MODE
CHAT_MODE → (Enter with text) → RESOLVING → DONE
TRIAGE → (Backspace) → RESOLVING → DONE
CHAT_MODE → (Esc) → TRIAGE
```

## Keyboard Hook Pattern

```tsx
// hooks/use-keyboard-inbox.ts
import { useEffect } from "react"

type InboxAction = "next" | "prev" | "accept" | "reject" | "chat" | "help"

export function useKeyboardInbox(
  onAction: (action: InboxAction) => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case "j": case "ArrowDown":  e.preventDefault(); onAction("next"); break
        case "k": case "ArrowUp":    e.preventDefault(); onAction("prev"); break
        case "Enter":               e.preventDefault(); onAction("accept"); break
        case "Backspace":           e.preventDefault(); onAction("reject"); break
        case "c": case "C":        onAction("chat"); break
        case "?":                   onAction("help"); break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [enabled, onAction])
}
```

## ConflictCard Pattern

```tsx
// components/domain/ConflictCard.tsx
interface ConflictCardProps {
  conflict: Conflict
  isActive: boolean
  onAccept: () => void
  onReject: () => void
  onChat: () => void
}

export function ConflictCard({ conflict, isActive, onAccept, onReject, onChat }: ConflictCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article
      className={`
        bg-card border rounded-2xl p-6 transition-all
        ${isActive ? "border-2 border-primary shadow-lg" : "border-border opacity-70"}
      `}
    >
      {/* Header: mono label + confidence badge */}
      <div className="flex justify-between items-start mb-4">
        <span className="font-mono text-xs tracking-wider text-muted-foreground">
          ◆ MEMORY_CONFLICT
        </span>
        <span className="bg-warning text-[var(--warning-foreground)] text-xs px-2 py-0.5 rounded-full font-mono">
          {Math.round(conflict.confidence * 100)}%
        </span>
      </div>

      {/* OLD memory */}
      <div className="bg-secondary/50 rounded-lg p-4 mb-3">
        <p className="text-xs font-mono text-muted-foreground mb-1">OLD</p>
        <p className="text-sm">{conflict.incumbent_text}</p>
        <p className="text-xs text-muted-foreground mt-1">Source: {conflict.incumbent_source}</p>
      </div>

      {/* NEW memory */}
      <div className="bg-primary/10 rounded-lg border border-primary/20 p-4 mb-3">
        <p className="text-xs font-mono text-primary mb-1">NEW</p>
        <p className="text-sm">{conflict.challenger_text}</p>
        <p className="text-xs text-muted-foreground mt-1">Source: {conflict.challenger_source}</p>
      </div>

      {/* AI suggestion */}
      <div className="bg-accent/30 rounded-lg p-4 mb-4">
        <p className="text-xs font-mono text-muted-foreground mb-1">◆ AI_SUGGESTION</p>
        <p className="text-sm italic">{conflict.ai_resolution}</p>
      </div>

      {/* Action row */}
      {expanded ? (
        <ConflictChat
          conflictId={conflict.id}
          onCancel={() => setExpanded(false)}
        />
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" className="flex-1 h-11 sm:h-8" onClick={onAccept}>
            Accept New
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-11 sm:h-8" onClick={onReject}>
            Keep Old
          </Button>
          <Button size="sm" variant="secondary" className="h-11 sm:h-8" onClick={() => setExpanded(true)}>
            Discuss
          </Button>
        </div>
      )}

      {/* Keyboard hints — desktop only */}
      <div className="hidden md:flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <Kbd>J</Kbd><Kbd>K</Kbd> navigate
        <Kbd>Enter</Kbd> accept
        <Kbd>Backspace</Kbd> keep
        <Kbd>C</Kbd> discuss
      </div>
    </article>
  )
}
```

## Optimistic Update Pattern

```tsx
// In MemoryInbox.tsx
const handleResolve = async (conflictId: string, action: "ACCEPT_NEW" | "KEEP_OLD") => {
  const prevConflicts = conflicts

  // 1. Optimistic: remove from list immediately
  setConflicts((prev) => prev.filter((c) => c.id !== conflictId))

  try {
    await apiFetch(`/v1/conflicts/${conflictId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action }),
    })
    // 2. If auto-resolved server-side, show undo toast
    toast((t) => (
      <div className="flex items-center justify-between gap-4">
        <span>Conflict resolved.</span>
        <button
          onClick={() => { undoResolve(conflictId); toast.dismiss(t.id) }}
          className="text-sm font-medium text-primary hover:underline"
        >
          Undo
        </button>
      </div>
    ), { duration: 30_000 })
  } catch {
    // 3. Revert on failure
    setConflicts(prevConflicts)
    toast({ title: "Failed to resolve conflict. Please try again.", variant: "destructive" })
  }
}
```

## Conflict Badge Pattern

```tsx
// components/domain/ConflictBadge.tsx
// Polls conflict count for sidebar badge
function ConflictBadge() {
  const { data } = useQuery({
    queryKey: ["conflicts", "pending-count"],
    queryFn: () => apiFetch<{ count: number }>("/v1/conflicts?status=pending&limit=1"),
    refetchInterval: 30_000,  // Poll every 30s
    staleTime: 15_000,
  })

  if (!data?.count) return null

  return (
    <span className="absolute -top-1 -right-1 bg-warning text-[var(--warning-foreground)]
                     text-[10px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center">
      {data.count > 9 ? "9+" : data.count}
    </span>
  )
}
```

## Three Flows Detail

### Flow 1: Binary Triage
- Target: Simple contradictions where AI's proposed resolution is clear
- J/K cycles through cards; Enter accepts; Backspace rejects
- Card animates out immediately (optimistic); API confirms in background
- On API failure: card animates back in + error toast

### Flow 2: Conversational Clarification
- Target: Ambiguous conflicts requiring nuanced resolution
- Triggered by pressing C on any card
- Card expands to show chat interface
- User types custom resolution; Enter sends to API with action=CUSTOM
- Esc cancels and collapses back to triage mode

### Flow 3: Auto-Resolution with Undo
- Target: Low-stakes conflicts where authority gap makes answer obvious
- Server-side auto-resolution triggers client notification via polling or SSE
- Sonner toast: "Updated [resolution]. Undo?" with 30-second countdown
- Clicking Undo calls `POST /v1/conflicts/{id}/undo`
- After 30s window expires: undo disabled (API returns 409)

## API Endpoints Used

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/conflicts?status=pending` | List pending conflicts |
| POST | `/v1/conflicts/{id}/resolve` | Resolve with ACCEPT_NEW / KEEP_OLD / CUSTOM |
| POST | `/v1/conflicts/{id}/undo` | Revert a resolution |
