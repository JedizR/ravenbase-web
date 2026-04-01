# STORY-034: Referral System

**Epic:** EPIC-08 — Polish & Production Hardening
**Priority:** P1
**Complexity:** Medium
**Depends on:** STORY-019 (onboarding), STORY-023 (credits system must be complete)

---

## Functional Requirements
<!-- Which FR acceptance criteria does this story satisfy? -->
None — referral system story.

## Component
UI/Polish

---

> **Before You Start — Read These Files First:**
> 1. `CLAUDE.md` — architecture rules (3-layer, lazy imports, structlog)
> 2. `docs/prd/05-monetization.md` — referral rules (rewards, caps, code format)
> 3. `docs/architecture/02-database-schema.md` — referral_code, referred_by_user_id, ReferralTransaction
> 4. `docs/stories/EPIC-08-polish/STORY-023.md` — credit transaction patterns

---

## User Story
As a satisfied user, I want a referral link I can share to earn credits when friends actually use the product.
As a new user arriving via referral, I want bonus credits so I can experience more before deciding to pay.

## Context
- Referral code = first 8 chars of user UUID, uppercase (e.g. `550E8400`)
- **Referee** gets +200 bonus credits on signup → 700 total (500 base + 200 referral)
- **Referrer** gets +200 credits when referee completes **first file upload** (not signup)
- Activation trigger prevents fake account abuse and ensures referrer earns via genuine users
- Monthly cap: 50 rewards per referrer (anti-abuse; invisible to normal users)
- Model switching for referral credits: still Haiku only (Free tier rules apply)

## Acceptance Criteria
- [ ] AC-1: On `user.created` Clerk webhook, `User.referral_code` auto-generated as first 8 chars of `User.id`, uppercase
- [ ] AC-2: If `/register?ref=CODE` was captured in frontend `localStorage` before Clerk redirect, backend `POST /v1/account/apply-referral` sets `User.referred_by_user_id` after signup. Invalid/expired codes silently ignored (not an error to the user).
- [ ] AC-3: Signup with valid referral code: referee receives +200 `signup_referral_bonus` credit transaction immediately. Referrer is NOT yet credited.
- [ ] AC-4: When referred user creates their first `Source` record (file or text): award referrer +200 credits via `referral_reward` transaction IF `User.referral_reward_claimed = False`
- [ ] AC-5: `User.referral_reward_claimed = True` set after AC-4 fires — one-time only
- [ ] AC-6: `ReferralTransaction` record created for every reward event
- [ ] AC-7: Monthly cap: if referrer already has 50 `ReferralTransaction` records this calendar month, skip and log `referral.monthly_cap_reached`
- [ ] AC-8: `GET /v1/account/referral` returns code, URL, stats
- [ ] AC-9: Settings → Referrals page shows referral link with one-click copy button, basic stats (total referrals, pending, credits earned)
- [ ] AC-10: Referral code lookup is case-insensitive (normalize input to uppercase before DB lookup)

## Technical Notes

### Files to Create
- `src/services/referral_service.py`

### Files to Modify
- `src/api/routes/webhooks.py` — call `generate_referral_code()` in `user.created` handler
- `src/workers/tasks/ingestion.py` — call `award_referrer_on_first_upload()` after first Source
- `src/api/routes/account.py` — add `GET /v1/account/referral` + `POST /v1/account/apply-referral`

### Referral Service Pattern

```python
# src/services/referral_service.py

def generate_referral_code(user_id: uuid.UUID) -> str:
    return str(user_id).replace("-", "").upper()[:8]

async def award_referrer_on_first_upload(referee_id: uuid.UUID, db: AsyncSession) -> None:
    """Triggered from ingestion task on first Source creation for a user."""
    referee = await db.get(User, referee_id)
    if not referee or not referee.referred_by_user_id or referee.referral_reward_claimed:
        return

    referrer = await db.get(User, referee.referred_by_user_id)
    if not referrer or not referrer.is_active:
        return

    # Monthly cap check
    month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly = (await db.execute(
        select(func.count()).where(
            ReferralTransaction.referrer_user_id == referrer.id,
            ReferralTransaction.created_at >= month_start,
        )
    )).scalar()
    if monthly >= 50:
        log.warning("referral.monthly_cap_reached", referrer_id=str(referrer.id))
        return

    referrer.credits_balance += 200
    referee.referral_reward_claimed = True
    db.add(ReferralTransaction(
        referrer_user_id=referrer.id,
        referee_user_id=referee.id,
        referrer_credits_awarded=200,
        referee_credits_awarded=0,
        trigger_event="first_upload",
    ))
    await db.commit()
    log.info("referral.reward_awarded", referrer=str(referrer.id), referee=str(referee.id))
```

### Architecture Constraints
- `referral_reward_claimed` is the idempotency guard — once True, never reward again
- Referral code generation is server-side (Clerk webhook) — never from registration form
- Frontend captures `?ref=CODE` in localStorage before Clerk redirect, calls `apply-referral` post-signup

## UX & Visual Quality Requirements

### Settings → Referrals Page UX
1. Referral link display card:
   bg-card rounded-2xl border border-border p-6 space-y-4

2. Referral link input (read-only):
   - Shows: https://ravenbase.app/register?ref=XXXXXX
   - Input: bg-secondary rounded-xl px-4 py-3 font-mono text-sm
   - Read-only, not editable
   - Full width on mobile

3. Copy button animation:
   - Default: "◆ COPY_LINK" with Copy icon
   - On click: call navigator.clipboard.writeText(referralUrl)
   - Success state (2 seconds): "◆ COPIED!" with Check icon
     (green check icon, text-success)
   - Button: rounded-full border border-border bg-card hover:bg-secondary
   - Transition: all 150ms ease on text/icon swap

4. Social share buttons:
   - Twitter/X: opens https://twitter.com/intent/tweet?text=...
   - LinkedIn: opens https://www.linkedin.com/sharing/share-offsite/?url=...
   - Each button: rounded-full border border-border p-2 hover:bg-secondary
   - Open in new tab: target="_blank" rel="noopener noreferrer"

5. Referral stats card:
   bg-card rounded-2xl border border-border p-6
   Show:
   - "X users referred" — large font-mono number in forest green
   - "X credits earned" — secondary stat
   - Progress bar toward next reward:
     "X more referrals to unlock Pro month free"
     Progress bar: bg-primary [&>div]:bg-warning (amber progress on green bar)

6. Reward milestones list:
   Visual timeline of reward tiers:
   1 referral → 100 bonus credits
   3 referrals → 500 bonus credits
   5 referrals → 1 month Pro free
   Each milestone: checkmark (green if reached), dot (amber if next), circle (gray if future)

## Definition of Done
- [ ] Referral codes auto-generated on user creation
- [ ] Referee bonus (+200) at signup; referrer reward (+200) on first upload
- [ ] Monthly cap enforced; `referral_reward_claimed` prevents double-award
- [ ] `GET /v1/account/referral` returns correct stats
- [ ] Settings → Referrals page with copy button
- [ ] `make quality && make test` passes

## Final Localhost Verification (mandatory before marking complete)

After `make quality && make test` passes, verify the running application works:

**Step 1 — Start dev server:**
```bash
cd ravenbase-api && make run
```

**Step 2 — Verify no runtime errors:**
- Test the referral endpoints with curl or a tool like Postman
- Confirm no unhandled exceptions in server logs
- Confirm structlog output is clean

**Step 3 — Report one of:**
- ✅ `localhost verified` — referral system runs correctly
- ⚠️ `Issue found: [describe issue]` — fix before committing docs

Only commit the docs update (epics.md, story-counter, project-status, journal) AFTER localhost verification passes.

## Testing This Story

```bash
# Test referral flow end-to-end:
# 1. Create user A (referral_code auto-assigned on signup via Clerk webhook)
# 2. Create user B via POST /v1/account/apply-referral body: {"referral_code": "USER_A_CODE"}
# 3. GET /v1/credits/balance for user B → expect 700 (500 base + 200 referral bonus)
# 4. GET /v1/credits/balance for user A → expect 500 (referrer reward NOT yet triggered)
# 5. User B creates first Source (POST /v1/ingest/upload or /v1/ingest/text)
# 6. GET /v1/credits/balance for user A → expect 700 (+200 referral reward triggered)
# 7. User B uploads a second file
# 8. GET /v1/credits/balance for user A → still 700 (referral_reward_claimed prevents double)
# 9. GET /v1/account/referral for user A → total_referrals: 1, credits_earned: 200
# 10. Test monthly cap: seed 50 ReferralTransaction rows for user A this calendar month,
#     trigger a 51st referral activation → verify reward NOT granted, warning logged
# 11. Test invalid code: POST /v1/account/apply-referral body: {"referral_code": "INVALID1"}
#     → expect 200 OK (silently ignored — invalid codes are not errors)
```

## Frontend Agent Brief

```
Implement STORY-034 Frontend: Settings → Referrals Page.

This is the FRONTEND PART ONLY. The backend (referral code generation, credit
reward logic, AC-1 through AC-10 in the Acceptance Criteria) must be implemented
in ravenbase-api first. This frontend story depends on those endpoints being deployed.

Read FIRST — read every file listed below completely before writing any code:
1. CLAUDE.md (all 19 frontend rules)
2. docs/design/AGENT_DESIGN_PREAMBLE.md — NON-NEGOTIABLE visual rules.
   Anti-patterns to REJECT:
   - Hardcoded hex colors (use CSS variables only)
   - Rounded-lg on cards (use rounded-2xl)
   - rounded-md on primary CTAs (use rounded-full)
3. docs/design/00-brand-identity.md — brand colors, mono labels, ◆ SECTION pattern
4. docs/design/01-design-system.md — all color tokens, typography
5. docs/architecture/03-api-contract.md — GET /v1/account/referral response shape
6. docs/stories/EPIC-08-polish/STORY-034.md (this file — frontend ACs 9-10)

SPECIFIC IMPLEMENTATION STEPS:

Step 1 — Create app/(dashboard)/settings/referrals/page.tsx:
Use the settings page layout pattern from other settings pages.

The page must include (per UX requirements):

1. Referral link display card:
<div className="bg-card rounded-2xl border border-border p-6 space-y-4">
  <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ REFERRAL_LINK</p>
  {/* Referral URL input (read-only) */}
  <div className="relative">
    <input
      readOnly
      value={referralUrl}
      className="w-full bg-secondary rounded-xl px-4 py-3 font-mono text-sm
                 text-foreground border border-border pr-20"
    />
    {/* Copy button overlaid on right */}
  </div>
</div>

2. Copy button with 2-second "COPIED!" state:
"use client"
import { useState } from "react"
import { Copy, Check } from "lucide-react"

const [copied, setCopied] = useState(false)

const handleCopy = async () => {
  await navigator.clipboard.writeText(referralUrl)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)  // AC-9b: 2s "COPIED!" state
}

<button
  onClick={handleCopy}
  className="absolute right-2 top-1/2 -translate-y-1/2
             flex items-center gap-1.5 px-3 py-1.5 rounded-full
             border border-border bg-card hover:bg-secondary
             text-xs font-mono transition-all duration-150"
>
  {copied
    ? <Check className="w-3 h-3 text-success" />
    : <Copy className="w-3 h-3 text-muted-foreground" />
  }
  {copied ? "COPIED!" : "COPY_LINK"}
</button>

3. Social share buttons (AC-9: social share):
<div className="flex gap-2">
  {/* Twitter/X */}
  <a
    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I'm using Ravenbase to build my AI memory. Get 200 free credits: " + referralUrl)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="p-2 rounded-full border border-border hover:bg-secondary transition-colors"
  >
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      {/* X/Twitter icon SVG */}
    </svg>
  </a>
  {/* LinkedIn */}
  <a
    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="p-2 rounded-full border border-border hover:bg-secondary transition-colors"
  >
    <Linkedin className="w-4 h-4" />
  </a>
</div>

4. Stats card (AC-9: referral stats):
<div className="bg-card rounded-2xl border border-border p-6 space-y-4">
  <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ REFERRAL_STATS</p>

  <div className="flex items-baseline gap-2">
    <span className="font-mono text-4xl font-bold text-primary">
      {totalReferrals}
    </span>
    <span className="text-sm text-muted-foreground">users referred</span>
  </div>

  <div className="text-sm text-muted-foreground">
    <span className="font-mono text-foreground">{creditsEarned}</span> credits earned
  </div>

  {/* Progress bar toward next reward */}
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground">
      {nextMilestone} more referrals to unlock Pro month free
    </p>
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-300"
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  </div>
</div>

5. Reward milestones timeline (AC-9):
Visual checkmarks for reached milestones:
const milestones = [
  { count: 1, reward: "100 bonus credits", reached: totalReferrals >= 1 },
  { count: 3, reward: "500 bonus credits", reached: totalReferrals >= 3 },
  { count: 5, reward: "1 month Pro free", reached: totalReferrals >= 5 },
]

{milestones.map((m, i) => (
  <div key={i} className="flex items-center gap-3">
    {/* Reached: green checkmark. Next: amber dot. Future: gray circle */}
    {m.reached
      ? <CheckCircle2 className="w-5 h-5 text-success" />
      : totalReferrals < m.count && i === milestones.findIndex(x => !x.reached)
        ? <div className="w-5 h-5 rounded-full bg-warning" />
        : <div className="w-5 h-5 rounded-full bg-secondary border border-border" />
    }
    <span className="text-sm text-foreground">
      {m.count} referral{m.count > 1 ? "s" : ""} → {m.reward}
    </span>
  </div>
))}

Step 2 — API integration:
GET /v1/account/referral returns:
{
  "referral_code": "550E8400",
  "referral_url": "https://ravenbase.app/register?ref=550E8400",
  "total_referrals": 2,
  "pending_referrals": 0,
  "credits_earned": 400,
  "current_month_count": 1,
  "monthly_cap": 50
}

Use useQuery to fetch this:
const { data, isLoading } = useQuery({
  queryKey: ["referral"],
  queryFn: () => apiFetch<ReferralResponse>("/v1/account/referral"),
  staleTime: 30_000,
})

Step 3 — Backend files needed first (confirm these exist):
Before implementing the frontend, verify these backend files are implemented:
- src/api/routes/account.py: GET /v1/account/referral
- src/api/routes/account.py: POST /v1/account/apply-referral
- src/services/referral_service.py
These are backend STORY-034 items. If missing, the frontend cannot be tested.

WHAT NOT TO DO:
- DO NOT use bg-[#xxxxxx] — use bg-primary, bg-card, bg-secondary
- DO NOT use rounded-lg on cards — use rounded-2xl
- DO NOT use rounded-md on CTAs — use rounded-full
- DO NOT use rounded-full on non-CTA elements

AC CHECKLIST:
□ Page accessible at /settings/referrals
□ Referral link displayed in read-only input
□ Copy button: shows "COPY_LINK" → "COPIED!" for 2 seconds on click
□ Social share: Twitter and LinkedIn links open in new tab
□ Stats card: total referrals, credits earned
□ Progress bar: toward next reward milestone
□ Milestone timeline: visual checkmarks/dots/circles
□ Font: font-mono on all mono labels, ◆ REFERRAL_LINK, ◆ REFERRAL_STATS

Show plan first. Do not implement yet.
```

## Development Loop
Follow `docs/DEVELOPMENT_LOOP.md`.
```bash
make quality && make test
git add -A && git commit -m "feat(ravenbase): STORY-034 referral system"
```
