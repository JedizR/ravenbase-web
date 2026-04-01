# STORY-036: Internal Admin Dashboard

**Epic:** EPIC-08 — Polish & Production Hardening
**Priority:** P1
**Complexity:** Medium (cross-repo: backend endpoints + frontend pages)
**Depends on:** STORY-023 (credits system), STORY-018 (auth pattern)

---

## Functional Requirements
<!-- Which FR acceptance criteria does this story satisfy? -->
None — internal admin dashboard story.

## Component
Admin

---

> **Before You Start — Read These Files First:**
> 1. `CLAUDE.md` — architecture rules (3-layer pattern, `require_user`, lazy imports, structlog)
> 2. `docs/architecture/03-api-contract.md` — all 5 admin endpoint specs (the `/v1/admin/` section)
> 3. `docs/architecture/02-database-schema.md` — User model (credits_balance, is_active, tier)
> 4. `docs/stories/EPIC-08-polish/STORY-023.md` — CreditTransaction patterns (`admin_adjustment` type)
> 5. `docs/design/CLAUDE_FRONTEND.md` — all 19 frontend rules (frontend session only)
>
> **Session routing:** This is a cross-repo story.
> **In the backend session:** Use the "Backend Agent Brief" at the bottom.
> **In the frontend session:** Use the "Frontend Agent Brief" at the bottom.
> ⚠️ Backend must be deployed and all 5 endpoints verified before the frontend session begins.

---

## User Story
As a founder/admin, I want an internal dashboard where I can view user accounts, adjust
credits manually, and see platform-level metrics — without needing to run raw SQL
against production PostgreSQL.

## Context
- Auth: `ADMIN_USER_IDS` env var — comma-separated Clerk user IDs (set in Railway + `.env.dev`)
- Backend: 5 new endpoints under `/v1/admin/` prefix, protected by `require_admin` dependency
- Frontend: `app/(admin)/` route group in ravenbase-web, verified by middleware
- No Clerk Organizations setup needed — just one env var

## Acceptance Criteria

### Backend
- [x] AC-1: `require_admin` FastAPI dependency: checks `user["user_id"] in settings.admin_user_ids.split(",")`. Returns `403` for authenticated non-admins. `ADMIN_USER_IDS` env var is required (empty = no admin access).
- [x] AC-2: `GET /v1/admin/users?search=&page=&limit=` returns paginated user list with search by email prefix
- [x] AC-3: `GET /v1/admin/users/{user_id}` returns user detail + last 20 credit transactions + source count
- [x] AC-4: `POST /v1/admin/credits/adjust` adds/removes credits, creates `CreditTransaction` with `type="admin_adjustment"` and `description` (audit trail for support)
- [x] AC-5: `POST /v1/admin/users/{user_id}/toggle-active` sets `User.is_active = True/False`
- [x] AC-6: `GET /v1/admin/stats` returns platform metrics including `daily_llm_spend_usd` from Redis circuit breaker key

### Frontend
- [ ] AC-7: `/admin` route group protected by middleware: if user's Clerk ID not in `ADMIN_USER_IDS`, redirect to `/dashboard`
- [ ] AC-8: `/admin` — Stats page: total users, DAU, new today, Pro users, daily LLM spend vs cap (progress bar), sources today, metadocs today
- [ ] AC-9: `/admin/users` — User list with search input (calls `GET /v1/admin/users?search=`), sortable table showing email, tier badge, credit balance, active status, join date
- [ ] AC-10: `/admin/users/[id]` — User detail page: user info + credit transaction history table + "Adjust Credits" form (amount + reason, positive to add, negative to remove) + ban/unban toggle button
- [ ] AC-11: Credit adjustment form: validates `amount` is a non-zero integer, `reason` is required (min 10 chars), shows `toast.success("Credits adjusted")` on success with new balance
- [ ] AC-12: Admin UI uses the existing Ravenbase design system (forest green, shadcn/ui, mono labels for system data). Admin pages have a red `◆ ADMIN_PANEL` mono label in the header to make it visually distinct from the user-facing dashboard.

## Technical Notes

### Files to Create (Backend)
- `src/api/routes/admin.py` — all 5 admin endpoints
- `src/api/dependencies/admin.py` — `require_admin` dependency

### Files to Modify (Backend)
- `src/api/main.py` — register `admin_router` under `/v1/admin/` prefix

### Files to Create (Frontend)
- `app/(admin)/layout.tsx` — admin auth check + admin header with `◆ ADMIN_PANEL`
- `app/(admin)/page.tsx` — stats dashboard
- `app/(admin)/users/page.tsx` — user list
- `app/(admin)/users/[id]/page.tsx` — user detail + credit adjustment

### require_admin Dependency Pattern

```python
# src/api/dependencies/admin.py

from src.api.dependencies.auth import require_user
from src.core.config import settings

async def require_admin(user: dict = Depends(require_user)) -> dict:
    """Extend require_user to verify admin access."""
    admin_ids = [uid.strip() for uid in settings.ADMIN_USER_IDS.split(",") if uid.strip()]
    if not admin_ids or user["user_id"] not in admin_ids:
        raise HTTPException(
            status_code=403,
            detail={"code": "ADMIN_REQUIRED", "message": "Admin access required"}
        )
    return user
```

### Admin Middleware Pattern (Frontend)

```tsx
// app/(admin)/layout.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(id => id.trim())

  if (!userId || !adminIds.includes(userId)) {
    redirect("/dashboard")  // Non-admins go to their dashboard silently
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <RavenbaseLockup size="sm" />
        <span className="font-mono text-xs text-destructive tracking-wider">
          ◆ ADMIN_PANEL
        </span>
      </header>
      <main>{children}</main>
    </div>
  )
}
```

### Architecture Constraints
- `require_admin` always calls `require_user` first — never bypasses JWT validation
- Admin endpoints are read/write; keep mutations simple (adjust balance, toggle active)
- Never expose other users' passwords, Clerk internal tokens, or payment instrument details
- Credit adjustments always create a CreditTransaction record — no silent balance changes
- `ADMIN_USER_IDS` env var must not be committed to the repo (add to `.gitignore` and `.env.example`)

## UX & Visual Quality Requirements

### Admin Dashboard Visual Design
1. Admin dashboard MUST feel like an internal tool, not a public product.
   All standard design system rules apply (forest green, cream bg, rounded-2xl cards).

2. Stat cards row at top (4 cards):
   - Total users / Active this week / Total credits used / Revenue this month
   - bg-card rounded-2xl border border-border p-6
   - Large number: font-mono text-3xl font-bold text-foreground
   - Label: text-xs font-mono text-muted-foreground tracking-wider below
   - Trend indicator: green ▲ or red ▼ with percentage vs last week
   - Card hover: hover:shadow-md transition-shadow

3. User management table:
   - Table header: bg-secondary/50 rounded-t-xl font-mono text-xs text-muted-foreground uppercase
   - Row hover: bg-secondary/30 transition-colors cursor-pointer
   - Each row shows: Avatar (Clerk imageUrl or initials fallback) | Email |
     Tier badge | Credits | Last active | Actions menu
   - Tier badges: Free=bg-secondary, Pro=bg-primary/10 text-primary,
     Team=bg-accent/30 text-foreground
   - Pagination: "Showing X-Y of Z" with Prev/Next buttons

4. Actions dropdown per user row:
   - Three-dot menu (MoreHorizontal icon) that opens a DropdownMenu
   - Options: View details | Adjust credits | Change tier | Disable account
   - Each option has an appropriate Lucide icon
   - Destructive action (Disable): text-destructive
   - Dropdown animation: scale(0.95)→scale(1) fade-in 150ms

5. Credit adjustment dialog:
   - Triggered from Actions → Adjust credits
   - Uses shadcn Dialog component
   - Shows current balance
   - +/- stepper buttons: increment/decrement by 100
   - Or direct input field for exact amount
   - Reason textarea (required, min 10 chars)
   - Submit button: rounded-full bg-primary (only enabled when reason filled)

6. Search/filter bar above table:
   - bg-secondary rounded-xl px-4 py-2 flex items-center gap-2
   - Search icon: text-muted-foreground
   - Input: bg-transparent outline-none text-sm placeholder:text-muted-foreground
   - Filter pills: Tier (All/Free/Pro/Team) and Status (All/Active/Disabled)
   - Each pill: rounded-full text-xs font-mono px-3 py-1
   - Active pill: bg-primary text-primary-foreground
   - Inactive pill: bg-secondary text-muted-foreground hover:bg-secondary/80

## Definition of Done
- [ ] `require_admin` returns `403` for non-admin authenticated users
- [ ] All 5 admin API endpoints work and are protected
- [ ] Admin UI accessible only to users in `ADMIN_USER_IDS`
- [ ] Credit adjustment creates audit CreditTransaction
- [ ] Stats page shows real data including daily LLM spend
- [ ] `make quality && make test` passes (backend)
- [ ] `npm run build` passes (frontend)

## Final Localhost Verification (mandatory before marking complete)

After `make quality && make test` (backend) and `npm run build` (frontend) pass, verify the running application works:

**Step 1 — Start backend dev server:**
```bash
cd ravenbase-api && make run
```

**Step 2 — Clear frontend cache and start dev server:**
```bash
rm -rf .next && npm run dev
```

**Step 3 — Verify no runtime errors:**
- Open http://localhost:3000 in the browser
- Log in as admin user, navigate to `/admin`
- Confirm NO "Internal Server Error" or webpack runtime errors
- Confirm CSS loads correctly (no unstyled content)
- Open browser DevTools → Console tab
- Confirm no red errors (yellow warnings acceptable)

**Step 4 — Report one of:**
- ✅ `localhost verified` — admin dashboard renders correctly
- ⚠️ `Issue found: [describe issue]` — fix before committing docs

Only commit the docs update (epics.md, story-counter, project-status, journal) AFTER localhost verification passes.

## Testing This Story

```bash
# Backend:
# 1. Set ADMIN_USER_IDS=your_clerk_user_id in .env.dev
# 2. Test GET /v1/admin/stats — should return platform metrics
# 3. Adjust credits for test user, verify CreditTransaction created
# 4. Test with non-admin JWT — should get 403

# Frontend:
# 1. Log in as admin user → navigate to /admin → see stats dashboard
# 2. Log in as non-admin → navigate to /admin → should redirect to /dashboard
```

---

## Backend Agent Brief

```
Implement STORY-036 backend: Admin API endpoints.

Read first:
1. CLAUDE.md (architecture rules — 3-layer, require_user pattern in auth.py)
2. docs/architecture/03-api-contract.md (all 5 admin endpoint specs)
3. docs/stories/EPIC-08-polish/STORY-036.md (this file, backend ACs 1-6)

Key:
- require_admin extends require_user — never bypass JWT validation
- Credit adjustment MUST create CreditTransaction record (audit trail)
- admin/stats reads llm:daily_spend:{today} from Redis

Show plan first. Do not implement yet.
```

---

## Frontend Agent Brief

```
Implement STORY-036 Frontend: Admin Dashboard UI.
Complete ONLY after backend STORY-036 endpoints are deployed and tested.

Read FIRST — read every file listed below completely before writing any code:
1. CLAUDE.md (all 19 frontend rules — especially RULE 5: no forced color mode, RULE 6: TanStack Query)
2. docs/design/AGENT_DESIGN_PREAMBLE.md — NON-NEGOTIABLE visual rules.
   Anti-patterns to REJECT:
   - Hardcoded hex colors (use CSS variables only)
   - Rounded-lg on cards (use rounded-2xl)
   - Using <form> tags (use onClick + controlled state)
3. docs/design/00-brand-identity.md — brand colors, mono labels, ◆ ADMIN_PANEL in red
4. docs/design/01-design-system.md — all color tokens, typography
5. docs/architecture/03-api-contract.md — GET /v1/admin/stats, GET /v1/admin/users,
   GET /v1/admin/users/{user_id}, POST /v1/admin/credits/adjust, POST /v1/admin/users/{user_id}/toggle-active
6. docs/stories/EPIC-08-polish/STORY-036.md (this file — frontend ACs 7-12)

SPECIFIC IMPLEMENTATION STEPS:

Step 1 — Create app/(admin)/layout.tsx:

"use client"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  // AC-7: redirect non-admins to /dashboard silently
  const adminIds = (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map(id => id.trim())
    .filter(Boolean)

  if (!userId || !adminIds.includes(userId)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        {/* RavenbaseLockup */}
        <RavenbaseLockup size="sm" />
        {/* AC-12: ◆ ADMIN_PANEL in text-destructive (RED), not green */}
        <span className="font-mono text-xs text-destructive tracking-wider font-bold">
          ◆ ADMIN_PANEL
        </span>
      </header>
      <main>{children}</main>
    </div>
  )
}

Step 2 — Create app/(admin)/page.tsx (Stats Dashboard):

Layout: 4 stat cards in a grid:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map(s => (
    <div key={s.label} className="bg-card rounded-2xl border border-border p-6
                                  hover:shadow-md transition-shadow">
      <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase mb-2">
        {s.label}
      </p>
      <p className="font-mono text-3xl font-bold text-foreground">{s.value}</p>
      {s.trend && (
        <p className={cn("text-xs font-mono mt-1", s.trend.up ? "text-success" : "text-destructive")}>
          {s.trend.up ? "▲" : "▼"} {s.trend.pct}% vs last week
        </p>
      )}
    </div>
  ))}
</div>

Stats to display (AC-8):
- Total users
- Active this week
- Total credits used
- Revenue this month
- Daily LLM spend vs cap (progress bar)

For LLM spend progress bar:
<div className="space-y-1">
  <div className="flex justify-between text-xs">
    <span className="text-muted-foreground">Daily LLM Spend</span>
    <span className="font-mono">${spend}/$2,000</span>
  </div>
  <div className="h-2 bg-secondary rounded-full overflow-hidden">
    <div className="h-full bg-primary rounded-full"
         style={{ width: `${Math.min(100, spend/2000*100)}%` }} />
  </div>
</div>

Step 3 — Create app/(admin)/users/page.tsx (User List):

Search + filter bar:
<div className="flex flex-col sm:flex-row gap-4 mb-6">
  {/* Search input */}
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search by email..."
      className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2
                 text-sm outline-none border border-border
                 focus:ring-2 focus:ring-primary/30 focus:border-primary"
    />
  </div>
  {/* Filter pills */}
  <div className="flex gap-2">
    {["All", "Free", "Pro", "Team"].map(tier => (
      <button
        key={tier}
        onClick={() => setTierFilter(tier)}
        className={cn(
          "px-3 py-1 rounded-full text-xs font-mono transition-colors",
          tierFilter === tier
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
        )}
      >
        {tier}
      </button>
    ))}
  </div>
</div>

User table using shadcn/ui Table:
<Table>
  <TableHeader>
    <TableRow className="bg-secondary/50 rounded-t-xl">
      <TableHead className="font-mono text-xs uppercase">User</TableHead>
      <TableHead className="font-mono text-xs uppercase">Tier</TableHead>
      <TableHead className="font-mono text-xs uppercase">Credits</TableHead>
      <TableHead className="font-mono text-xs uppercase">Status</TableHead>
      <TableHead className="font-mono text-xs uppercase">Joined</TableHead>
      <TableHead className="w-12" />
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map(user => (
      <TableRow key={user.id} className="hover:bg-secondary/30 cursor-pointer">
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.email}</span>
          </div>
        </TableCell>
        <TableCell>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-mono",
            user.tier === "pro" ? "bg-primary/10 text-primary" :
            user.tier === "team" ? "bg-accent/30 text-foreground" :
            "bg-secondary text-muted-foreground"
          )}>
            {user.tier.toUpperCase()}
          </span>
        </TableCell>
        <TableCell className="font-mono text-sm">{user.credits_balance}</TableCell>
        <TableCell>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-mono",
            user.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {user.is_active ? "ACTIVE" : "DISABLED"}
          </span>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" /> View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreditAdjust(user)}>
                <Coins className="w-4 h-4 mr-2" /> Adjust credits
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleActive(user)}
                className={cn(!user.is_active && "text-success")}
              >
                <Ban className="w-4 h-4 mr-2" />
                {user.is_active ? "Disable account" : "Enable account"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

Step 4 — Credit Adjustment Dialog:
AC-11: amount ≠ 0, reason ≥ 10 chars

<Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
  <DialogContent className="rounded-2xl">
    <DialogTitle>Adjust Credits</DialogTitle>
    <p className="text-sm text-muted-foreground">
      Current balance: <span className="font-mono">{selectedUser?.credits_balance}</span>
    </p>

    {/* Amount stepper */}
    <div className="flex items-center gap-4">
      <Button variant="outline" size="icon"
              onClick={() => setAdjustAmount(a => a - 100)}>
        <Minus className="w-4 h-4" />
      </Button>
      <input
        type="number"
        value={adjustAmount}
        onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
        className="w-24 text-center font-mono text-lg border border-border rounded-xl px-3 py-2"
      />
      <Button variant="outline" size="icon"
              onClick={() => setAdjustAmount(a => a + 100)}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>

    {/* Reason textarea */}
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Reason (min 10 characters)</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe why you're adjusting this user's credits..."
        rows={3}
        className="w-full rounded-xl border border-border px-3 py-2 text-sm
                   focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      {reason.length > 0 && reason.length < 10 && (
        <p className="text-xs text-destructive">
          {10 - reason.length} more characters required
        </p>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setCreditDialogOpen(false)}>Cancel</Button>
      <Button
        onClick={submitCreditAdjust}
        disabled={adjustAmount === 0 || reason.length < 10}
        className="rounded-full bg-primary"
      >
        {adjustAmount > 0 ? `Add ${adjustAmount}` : adjustAmount < 0 ? `Remove ${Math.abs(adjustAmount)}` : "Set amount"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

Step 5 — loading.tsx files (required):
Create loading.tsx for admin pages using shadcn Skeleton component.

WHAT NOT TO DO:
- DO NOT use <form> tags — use onClick + controlled state
- DO NOT use rounded-lg on cards — use rounded-2xl
- DO NOT use bg-primary for ◆ ADMIN_PANEL — use text-destructive (RED)
- DO NOT allow credit adjustment with 0 amount or < 10 char reason
- DO NOT skip loading.tsx siblings

AC CHECKLIST:
□ /admin route group: middleware/admin auth check (ADMIN_USER_IDS)
□ Non-admin → redirect to /dashboard silently
□ Stats page: 4 stat cards with trend indicators
□ User list: search + tier filter pills + sortable table
□ Table: email, tier badge, credits, status, joined date, actions dropdown
□ Tier badges: Free=bg-secondary, Pro=bg-primary/10, Team=bg-accent/30
□ Actions dropdown: View details, Adjust credits, Disable/Enable
□ Credit dialog: stepper (+/- 100), reason textarea (min 10 chars validation)
□ Submit disabled until valid amount + reason
□ toast.success on successful credit adjustment
□ Ban/unban button with confirmation
□ loading.tsx for all admin pages

Show plan first. Do not implement yet.
```

---

## Development Loop
Follow `docs/DEVELOPMENT_LOOP.md`.
```bash
# Backend:
make quality && make test
git commit -m "feat(ravenbase): STORY-036 admin API endpoints"

# Frontend:
npm run build && npm run test
git commit -m "feat(ravenbase): STORY-036 admin dashboard frontend"
```
