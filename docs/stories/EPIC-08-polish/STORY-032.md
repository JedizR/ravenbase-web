# STORY-032: Transactional Email System (Resend + React Email)

**Epic:** EPIC-08 — Polish & Production Hardening
**Priority:** P1
**Complexity:** Medium
**Depends on:** STORY-018 (Clerk auth + user.created webhook must exist)

---

## Functional Requirements
<!-- Which FR acceptance criteria does this story does this story satisfy? -->
None — transactional email story.

## Component
UI/Polish

---

> **Before You Start This Story — Read These Files First:**
> 1. `CLAUDE.md` — architecture rules (backend: 3-layer pattern, lazy imports)
> 2. `docs/architecture/05-security-privacy.md` — PII handling; never log email content
> 3. `docs/stories/EPIC-06-auth-profiles/STORY-018.md` — Clerk webhook setup (this story extends it)
> 4. `docs/stories/EPIC-08-polish/STORY-023.md` — Credit system (low-credits trigger uses credit balance)

---

## User Story
As a new user, I want to receive a welcome email after signing up so I know my account is active.
As a power user, I want to be warned when my credits are running low so I can upgrade before hitting a wall.
As any user who uploads a large file, I want a completion notification when processing finishes.

## Context
- Email provider: **Resend** (resend.com) — developer-friendly, App Router native, free tier: 3,000 emails/month
- Template engine: **React Email** (`@react-email/components`) — Resend's companion library for React-based email templates
- All emails are triggered server-side — never from frontend code
- Trigger points:
  1. **Welcome email** — Clerk webhook `user.created` fires (STORY-018 webhook handler)
  2. **Low credits warning** — credit balance drops below 10% of monthly allocation
  3. **Ingestion complete** — source file > 2MB finishes processing (large files only — small files are instant and don't need notification)
- PII rule: email addresses are the only PII in email payloads. Never log email content. Never include memory content in emails.

## Acceptance Criteria
- [ ] AC-1: New user receives a welcome email within 30 seconds of `user.created` Clerk webhook firing
- [ ] AC-2: Welcome email contains: Ravenbase logo, user's first name (from Clerk), a "Get started" CTA linking to `/dashboard`, and a one-line tagline matching brand voice
- [ ] AC-3: When a user's credit balance drops to < 10% of their plan's monthly allocation, a low-credits warning email is sent (once per billing period — not every single deduction)
- [ ] AC-4: When a source file > 2MB completes Docling processing (status = COMPLETED), an ingestion complete notification is sent
- [ ] AC-5: All emails are branded: `from: "Ravenbase <hello@ravenbase.app>"` with Ravenbase logo in header, primary color (#2d4a3e) for CTAs, warm cream (#f5f3ee) background
- [ ] AC-6: Failed email sends are logged with structlog at `error` level but never crash the triggering operation — email failure is non-fatal
- [ ] AC-7: `RESEND_API_KEY` environment variable controls sending; if absent, emails are skipped with a `warning` log (allows development without sending real emails)
- [ ] AC-8: No email is sent during test runs (`APP_ENV=test`)
- [ ] AC-9: `POST /webhooks/resend` handles `email.bounced`: disables the specific `notify_*` flag for that user based on which email type bounced (determined by email subject match). Logs `email.bounced` at `warning` level.
- [ ] AC-10: `POST /webhooks/resend` handles `email.complained` (spam report): sets ALL THREE `notify_*` flags to `False` — spam complaint is more severe than a bounce and indicates the user doesn't want ANY emails. Logs `email.complained` at `warning` level.
- [ ] AC-11: Resend webhook signature validated using `svix` library (same pattern as Clerk webhook in STORY-018). Reject unauthenticated requests with `403`.

## Technical Notes

### Stack
- Provider: Resend (`resend` Python SDK from PyPI)
- Templates: HTML strings styled with inline CSS (React Email is frontend-only; use plain HTML strings in Python backend)
- Sending: async via `resend.Emails.send_async()` — never blocks the request lifecycle

### Files to Create
- `src/services/email_service.py` — EmailService with send_welcome, send_low_credits, send_ingestion_complete
- `src/adapters/resend_adapter.py` — thin wrapper around Resend Python SDK
- `src/templates/emails/welcome.py` — HTML template function returning email HTML string
- `src/templates/emails/low_credits.py` — HTML template function
- `src/templates/emails/ingestion_complete.py` — HTML template function
- `tests/unit/services/test_email_service.py`

### Files to Modify
- `src/api/routes/webhooks.py` — call `email_service.send_welcome()` inside `user.created` handler (after user is saved to DB)
- `src/workers/tasks/ingestion.py` — call `email_service.send_ingestion_complete()` when source > 2MB reaches COMPLETED
- `src/services/credit_service.py` — call `email_service.send_low_credits()` after deduction if balance < 10%
- `src/api/routes/webhooks.py` — add `POST /webhooks/resend` handler

### Resend Bounce & Complaint Webhook

```python
# POST /webhooks/resend — handles bounce and complaint events

@router.post("/webhooks/resend")
async def handle_resend_webhook(request: Request, db: AsyncSession):
    payload = await request.body()
    try:
        wh = Webhook(settings.RESEND_WEBHOOK_SECRET)
        event = wh.verify(payload, {
            "svix-id": request.headers.get("svix-id"),
            "svix-timestamp": request.headers.get("svix-timestamp"),
            "svix-signature": request.headers.get("svix-signature"),
        })
    except WebhookVerificationError:
        raise HTTPException(status_code=403)

    event_type = event.get("type")
    to_email = event.get("data", {}).get("email", {}).get("to", [None])[0]
    subject = event.get("data", {}).get("email", {}).get("subject", "")
    if not to_email:
        return {"status": "ignored"}

    user = (await db.execute(select(User).where(User.email == to_email))).scalar_one_or_none()
    if not user:
        return {"status": "user_not_found"}  # Return 200 — Resend retries on 5xx

    if event_type == "email.bounced":
        # Disable only the specific notification type
        if "welcome" in subject.lower():
            user.notify_welcome = False
        elif "credit" in subject.lower():
            user.notify_low_credits = False
        elif "processed" in subject.lower() or "complete" in subject.lower():
            user.notify_ingestion_complete = False
        await db.commit()
        log.warning("email.bounced", user_id=str(user.id), subject=subject)

    elif event_type == "email.complained":
        # Spam complaint — disable ALL notifications
        user.notify_welcome = False
        user.notify_low_credits = False
        user.notify_ingestion_complete = False
        await db.commit()
        log.warning("email.complained", user_id=str(user.id))

    return {"status": "handled"}
```

### EmailService Pattern

```python
# src/services/email_service.py
import os
from structlog import get_logger
from src.adapters.resend_adapter import ResendAdapter
from src.templates.emails.welcome import render_welcome_email
from src.templates.emails.low_credits import render_low_credits_email
from src.templates.emails.ingestion_complete import render_ingestion_complete_email

log = get_logger()

class EmailService:
    def __init__(self, resend: ResendAdapter | None = None):
        self._resend = resend or ResendAdapter()

    async def send_welcome(self, email: str, first_name: str, notify: bool = True) -> None:
        """Send welcome email to new user. Non-fatal — never raise."""
        if os.getenv("APP_ENV") == "test":
            return
        if not notify:
            log.info("email.skipped", reason="user_preference", type="welcome")
            return
        if not os.getenv("RESEND_API_KEY"):
            log.warning("email.skipped", reason="RESEND_API_KEY not set", type="welcome")
            return
        try:
            html = render_welcome_email(first_name=first_name)
            await self._resend.send(
                to=email,
                subject="Welcome to Ravenbase",
                html=html,
            )
            log.info("email.sent", type="welcome")
        except Exception as e:
            log.error("email.send_failed", type="welcome", error=str(e))
            # Never re-raise — email failure is non-fatal

    async def send_low_credits(self, email: str, balance: int, plan_limit: int, notify: bool = True) -> None:
        """Send low credits warning. Non-fatal."""
        if os.getenv("APP_ENV") == "test":
            return
        if not notify:
            log.info("email.skipped", reason="user_preference", type="low_credits")
            return
        if not os.getenv("RESEND_API_KEY"):
            log.warning("email.skipped", reason="RESEND_API_KEY not set", type="low_credits")
            return
        try:
            html = render_low_credits_email(balance=balance, plan_limit=plan_limit)
            await self._resend.send(
                to=email,
                subject=f"You have {balance} credits remaining — Ravenbase",
                html=html,
            )
            log.info("email.sent", type="low_credits", balance=balance)
        except Exception as e:
            log.error("email.send_failed", type="low_credits", error=str(e))

    async def send_ingestion_complete(
        self, email: str, filename: str, node_count: int, notify: bool = True
    ) -> None:
        """Send ingestion completion for large files (> 2MB). Non-fatal."""
        if os.getenv("APP_ENV") == "test":
            return
        if not notify:
            log.info("email.skipped", reason="user_preference", type="ingestion_complete")
            return
        if not os.getenv("RESEND_API_KEY"):
            return
        try:
            html = render_ingestion_complete_email(
                filename=filename, node_count=node_count
            )
            await self._resend.send(
                to=email,
                subject=f"✓ {filename} has been processed — Ravenbase",
                html=html,
            )
            log.info("email.sent", type="ingestion_complete", filename=filename)
        except Exception as e:
            log.error("email.send_failed", type="ingestion_complete", error=str(e))
```

### Email Template Pattern (plain Python HTML string)

```python
# src/templates/emails/welcome.py
BRAND_GREEN = "#2d4a3e"
BRAND_CREAM = "#f5f3ee"
BRAND_CARD = "#ffffff"

def render_welcome_email(first_name: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:{BRAND_CREAM};font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:{BRAND_CARD};border-radius:12px;overflow:hidden;">
        <!-- Header with primary green -->
        <tr><td style="background:{BRAND_GREEN};padding:32px 40px;">
          <p style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.1em;margin:0;font-family:Arial,sans-serif;">RAVENBASE</p>
          <p style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.15em;margin:4px 0 0;font-family:monospace;">WHAT HAPPENED, WHERE, AND WHEN. ALWAYS.</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h1 style="font-size:28px;color:#1a1a1a;margin:0 0 16px;font-family:Georgia,serif;">Welcome, {first_name}.</h1>
          <p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 24px;">
            Your exocortex is ready. Start by uploading your notes, chat exports, or documents — Ravenbase will build your knowledge graph automatically.
          </p>
          <a href="https://ravenbase.app/dashboard"
             style="display:inline-block;background:{BRAND_GREEN};color:#ffffff;text-decoration:none;
                    padding:14px 28px;border-radius:9999px;font-size:14px;font-weight:600;margin-bottom:32px;">
            Open Ravenbase
          </a>
          <p style="font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:24px;margin:0;">
            You received this because you created a Ravenbase account.
            <a href="https://ravenbase.app/privacy" style="color:{BRAND_GREEN};">Privacy Policy</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
```

### Architecture Constraints
- Before sending any email, check the user's notification preference:
  - `send_welcome()` → only send if `user.notify_welcome is True`
  - `send_low_credits()` → only send if `user.notify_low_credits is True`
  - `send_ingestion_complete()` → only send if `user.notify_ingestion_complete is True`
  - The `user` object must be passed into each send method (already available from the calling context)
  - This check runs AFTER the `APP_ENV=test` check and AFTER the `RESEND_API_KEY` check
- `resend` Python SDK import must be lazy: `import resend  # noqa: PLC0415` inside the method body
- Email sending must be `async` — use `resend.Emails.send_async()` or wrap sync call with `asyncio.to_thread()`
- Never include memory content, conflict text, or document content in any email body
- Never log the `to` email address at any log level — only log `type` and `bool(success)`
- `send_low_credits()` must be called from credit_service only once per billing period — track in a `low_credits_email_sent_at` column on `User` model, reset on monthly credit refresh

### Environment Variable
```bash
# .envs/.env.dev — add this line:
RESEND_API_KEY=re_test_xxxxxxxxxxxx   # Get from resend.com → API Keys → Create API Key
# Leave blank to skip email sending in local development
```

### pyproject.toml
Add to dependencies:
```toml
"resend>=2.5.0",
```

## UX & Visual Quality Requirements

### Settings → Notifications UX
1. Email preview cards for each template type:
   - Welcome email preview
   - Low credits warning preview (triggers at < 100 credits)
   - Ingestion complete preview
   Each card: bg-card rounded-2xl border border-border p-4
   Preview shows styled mock of the email header + first paragraph

2. "Send test email" button per template:
   - Button: rounded-full bg-primary text-primary-foreground h-10 px-4 text-sm
   - Loading state: spinner + "Sending..."
   - Success: toast.success("Test email sent to your@email.com")
   - Error: toast.error("Failed to send. Check your Resend API key in .env")

3. Toggle per notification type:
   - Forest green switch when on (same Toggle component as settings page)
   - Label: text-sm font-medium text-foreground
   - Description: text-xs text-muted-foreground below label

### Email Template Visual Requirements
4. All email templates must use brand colors:
   - Header: forest green #2d4a3e background with white Ravenbase logo text
   - Body background: warm cream #f5f3ee
   - Body text: DM Sans (font-family in inline styles for email compatibility)
   - CTAs: forest green #2d4a3e background, white text, border-radius: 9999px
   - Mono labels: JetBrains Mono (or fallback Courier New for email)
   - Footer: muted text with ◆ ALL_SYSTEMS_OPERATIONAL
   Use inline styles for all email HTML (not Tailwind — email clients ignore it)

5. All 3 email templates must render as actual HTML that can be previewed.
   Store templates as functions that return HTML strings in
   src/services/email_templates.py (ravenbase-api).

## Definition of Done
- [ ] Welcome email sends successfully when Clerk `user.created` webhook fires
- [ ] Low credits email fires when balance < 10% (only once per billing period)
- [ ] Ingestion complete email fires for files > 2MB on COMPLETED status
- [ ] Failed sends log at error level but never raise (non-fatal)
- [ ] Emails skip when `APP_ENV=test`
- [ ] `make quality && make test` passes (0 errors, 0 failures)

## Final Localhost Verification (mandatory before marking complete)

After `make quality && make test` passes and all tests pass, verify the running application works:

**Step 1 — Start dev server:**
```bash
cd ravenbase-api && make run
```

**Step 2 — Verify no runtime errors:**
- Test the email sending endpoint manually or via webhook simulator
- Confirm no unhandled exceptions in server logs
- Confirm structlog output is clean (no ERROR level emails)

**Step 3 — Report one of:**
- ✅ `localhost verified` — email service initializes and runs correctly
- ⚠️ `Issue found: [describe issue]` — fix before committing docs

Only commit the docs update (epics.md, story-counter, project-status, journal) AFTER localhost verification passes.

## Testing This Story

```bash
# 1. Set RESEND_API_KEY in .envs/.env.dev (use test key from resend.com)
# 2. Trigger welcome email via Clerk webhook simulation:
stripe listen &   # or use ngrok for Clerk webhook
# Or call directly in a Python shell:
# from src.services.email_service import EmailService
# import asyncio
# asyncio.run(EmailService().send_welcome("your@email.com", "Jedi"))

# 3. Check Resend dashboard at resend.com/emails — verify email appears

# 4. Test skip behavior:
APP_ENV=test python3 -c "
import asyncio
from src.services.email_service import EmailService
asyncio.run(EmailService().send_welcome('test@test.com', 'Test'))
# Should log: email.skipped (not send)
"
```

---

## Backend Agent Brief

> **Skill Invocations — MUST use these for each phase. Paste each skill call as a separate message before starting that phase:**
>
> **Phase 1 (Design):** `Use /python-expert — for FastAPI route patterns and async service architecture`
> **Phase 2 (Service):** `Use /fastapi-expert — for email service and webhook handler implementation`
> **Phase 3 (Testing):** `Use /superpowers:test-driven-development — write tests BEFORE implementation`
> **Phase 4 (Verification):** `Use /superpowers:verification-before-completion — before reporting complete`

---

```
🎯 Target: Claude Code / MiniMax-M2.7 — Ultra-detailed planning and implementation
💡 Optimization: MiniMax-M2.7 directive — WRITE EVERYTHING IN MAXIMUM DETAIL.
   Complete code for every component. Complete grep commands for every AC.

═══════════════════════════════════════════════════════════════════
STEP 0 — PROJECT CONTEXT (carry forward to every phase)
═══════════════════════════════════════════════════════════════════

Ravenbase Backend: Python FastAPI + SQLModel + ARQ + Redis + PostgreSQL
Architecture: 3-layer (routes → services → adapters), lazy imports, structlog
Email provider: Resend (resend Python SDK), HTML templates as Python string functions
DO NOT introduce new patterns — follow the established 3-layer architecture exactly.

═══════════════════════════════════════════════════════════════════
STEP 1 — READ PHASE (mandatory — read ALL files before touching code)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /python-expert

Then read ALL of these files in order — NOT in parallel:

1. CLAUDE.md
   → All 11 architecture rules. Especially:
   - RULE 6: heavy imports are LAZY (import resend inside function body)
   - RULE 7: no print() — structlog only
   - RULE 3: operations >2s use ARQ queue

2. docs/architecture/05-security-privacy.md
   → PII rules: never log email content, never include memory content in emails

3. docs/stories/EPIC-06-auth-profiles/STORY-018.md
   → Clerk webhook handler pattern to extend for user.created → send_welcome()

4. docs/stories/EPIC-08-polish/STORY-023.md
   → Credit system: low_credits_email_sent_at column, balance < 10% trigger

5. docs/stories/EPIC-08-polish/STORY-032.md (this file)
   → All ACs 1-11. Implementation must satisfy all 11.

═══════════════════════════════════════════════════════════════════
STEP 2 — ADD DEPENDENCY (Phase 2a)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /fastapi-expert

Add to pyproject.toml dependencies section:
"resend>=2.5.0",

Verify with:
grep -n "resend" pyproject.toml
# Expected: "resend>=2.5.0", in dependencies section

Also add to .envs/.env.example:
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=

═══════════════════════════════════════════════════════════════════
STEP 3 — CREATE RESEND ADAPTER (Phase 2b)
═══════════════════════════════════════════════════════════════════

FILE: src/adapters/resend_adapter.py

"""
Resend email adapter — thin wrapper around Resend Python SDK.
LAZY import: resend module loaded inside send() to avoid import-time side effects.
"""
from __future__ import annotations

import resend  # noqa: PLC0415 — lazy import inside method
from structlog import get_logger

from src.core.config import settings

log = get_logger()


class ResendAdapter:
    """Adapter for sending emails via Resend API."""

    def __init__(self) -> None:
        self._configured = bool(settings.RESEND_API_KEY)

    def _ensure_configured(self) -> None:
        if not self._configured:
            raise RuntimeError("RESEND_API_KEY not configured")

    async def send(self, *, to: str, subject: str, html: str) -> dict:
        """
        Send an email via Resend.
        Returns the Resend API response dict.
        Raises on failure (caller must catch and log non-fatally).
        """
        self._ensure_configured()

        import resend  # noqa: PLC0415 — lazy inside async method is fine

        resend.api_key = settings.RESEND_API_KEY

        params: resend.Emails.SendParams = {
            "from": "Ravenbase <hello@ravenbase.app>",
            "to": to,
            "subject": subject,
            "html": html,
        }

        result = await resend.Emails.send_async(params)  # type: ignore[arg-type]
        log.info("resend.api_response", email_type=subject[:30], success=True)
        return result

═══════════════════════════════════════════════════════════════════
STEP 4 — CREATE EMAIL TEMPLATES (Phase 2c)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /fastapi-expert

FILE: src/templates/emails/welcome.py

BRAND_GREEN = "#2d4a3e"
BRAND_CREAM = "#f5f3ee"
BRAND_CARD = "#ffffff"
BRAND_MUTED = "#9ca3af"


def render_welcome_email(first_name: str) -> str:
    """
    Render the welcome email HTML.
    AC-2: Contains user's first name, Ravenbase logo text, CTA to /dashboard.
    AC-5: Brand colors — green header, cream body, white card.
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Ravenbase</title>
</head>
<body style="margin:0;padding:0;background:{BRAND_CREAM};font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:{BRAND_CARD};border-radius:12px;overflow:hidden;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header: forest green with Ravenbase logo text -->
        <tr>
          <td style="background:{BRAND_GREEN};padding:32px 40px;">
            <p style="color:#ffffff;font-size:22px;font-weight:800;
                       letter-spacing:0.1em;margin:0;font-family:Arial,sans-serif;">
              RAVENBASE
            </p>
            <p style="color:rgba(255,255,255,0.7);font-size:11px;
                       letter-spacing:0.15em;margin:6px 0 0;
                       font-family:'Courier New',monospace;">
              WHAT HAPPENED, WHERE, AND WHEN. ALWAYS.
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="font-size:28px;color:#1a1a1a;margin:0 0 16px;
                       font-family:Georgia,serif;line-height:1.2;">
              Welcome, {first_name}.
            </h1>
            <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 24px;">
              Your exocortex is ready. Start by uploading your notes, chat exports,
              or documents — Ravenbase will build your knowledge graph automatically.
            </p>
            <!-- CTA Button: forest green, pill-shaped -->
            <a href="https://ravenbase.app/dashboard"
               style="display:inline-block;background:{BRAND_GREEN};color:#ffffff;
                      text-decoration:none;padding:14px 32px;border-radius:9999px;
                      font-size:14px;font-weight:600;margin-bottom:32px;">
              Open Ravenbase →
            </a>
            <!-- Footer -->
            <p style="font-size:12px;color:{BRAND_MUTED};
                       border-top:1px solid #e5e7eb;padding-top:24px;margin:0;
                       line-height:1.6;">
              You received this because you created a Ravenbase account.<br>
              <a href="https://ravenbase.app/privacy"
                 style="color:{BRAND_GREEN};text-decoration:none;">Privacy Policy</a>
              &nbsp;·&nbsp;
              <span style="font-family:'Courier New',monospace;font-size:10px;">
                ◆ ALL_SYSTEMS_OPERATIONAL
              </span>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


═══════════════════════════════════════════════════════════════════
FILE: src/templates/emails/low_credits.py

BRAND_GREEN = "#2d4a3e"
BRAND_CREAM = "#f5f3ee"
BRAND_CARD = "#ffffff"
BRAND_MUTED = "#9ca3af"
BRAND_WARNING = "#ffc00d"


def render_low_credits_email(balance: int, plan_limit: int) -> str:
    """
    Render the low credits warning email HTML.
    AC-3: Warns user when balance < 10% of plan_limit.
    AC-5: Brand colors, CTA to upgrade.
    """
    pct = round((balance / plan_limit) * 100) if plan_limit > 0 else 0
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Low credits — Ravenbase</title>
</head>
<body style="margin:0;padding:0;background:{BRAND_CREAM};font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:{BRAND_CARD};border-radius:12px;overflow:hidden;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:{BRAND_GREEN};padding:32px 40px;">
            <p style="color:#ffffff;font-size:22px;font-weight:800;
                       letter-spacing:0.1em;margin:0;font-family:Arial,sans-serif;">
              RAVENBASE
            </p>
            <p style="color:rgba(255,255,255,0.7);font-size:11px;
                       letter-spacing:0.15em;margin:6px 0 0;
                       font-family:'Courier New',monospace;">
              CREDIT_BALANCE_WARNING
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <!-- Warning indicator -->
            <div style="display:inline-block;background:{BRAND_WARNING};
                        color:#1a1a1a;border-radius:6px;padding:4px 10px;
                        font-size:11px;font-weight:700;letter-spacing:0.05em;
                        margin-bottom:16px;font-family:'Courier New',monospace;">
              ⚠ LOW_CREDITS — {pct}% REMAINING
            </div>
            <h1 style="font-size:26px;color:#1a1a1a;margin:0 0 16px;
                       font-family:Georgia,serif;line-height:1.2;">
              {balance.toLocaleString()} credits remaining.
            </h1>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
              Your Ravenbase account has used {round((1 - balance/plan_limit)*100) if plan_limit > 0 else 0}%
              of its monthly allocation. Upgrade to Pro to keep your knowledge
              graph growing without interruption.
            </p>
            <!-- Credit bar -->
            <div style="background:#e8ebe6;border-radius:8px;height:8px;margin:0 0 24px;overflow:hidden;">
              <div style="background:{BRAND_GREEN};width:{pct}%;height:8px;border-radius:8px;"></div>
            </div>
            <!-- CTA -->
            <a href="https://ravenbase.app/pricing"
               style="display:inline-block;background:{BRAND_GREEN};color:#ffffff;
                      text-decoration:none;padding:14px 32px;border-radius:9999px;
                      font-size:14px;font-weight:600;margin-bottom:32px;">
              Upgrade to Pro →
            </a>
            <p style="font-size:12px;color:{BRAND_MUTED};
                       border-top:1px solid #e5e7eb;padding-top:24px;margin:0;line-height:1.6;">
              Your balance resets on your monthly billing date.<br>
              <a href="https://ravenbase.app/privacy"
                 style="color:{BRAND_GREEN};text-decoration:none;">Privacy Policy</a>
              &nbsp;·&nbsp;
              <span style="font-family:'Courier New',monospace;font-size:10px;">
                ◆ ALL_SYSTEMS_OPERATIONAL
              </span>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


═══════════════════════════════════════════════════════════════════
FILE: src/templates/emails/ingestion_complete.py

BRAND_GREEN = "#2d4a3e"
BRAND_CREAM = "#f5f3ee"
BRAND_CARD = "#ffffff"
BRAND_MUTED = "#9ca3af"


def render_ingestion_complete_email(filename: str, node_count: int) -> str:
    """
    Render the ingestion complete notification email HTML.
    AC-4: Notifies user when file > 2MB finishes processing.
    AC-5: Brand colors.
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{filename} processed — Ravenbase</title>
</head>
<body style="margin:0;padding:0;background:{BRAND_CREAM};font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:{BRAND_CARD};border-radius:12px;overflow:hidden;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:{BRAND_GREEN};padding:32px 40px;">
            <p style="color:#ffffff;font-size:22px;font-weight:800;
                       letter-spacing:0.1em;margin:0;font-family:Arial,sans-serif;">
              RAVENBASE
            </p>
            <p style="color:rgba(255,255,255,0.7);font-size:11px;
                       letter-spacing:0.15em;margin:6px 0 0;
                       font-family:'Courier New',monospace;">
              INGESTION_COMPLETE
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <!-- Success indicator -->
            <div style="display:inline-block;background:#3d8b5a;color:#ffffff;
                        border-radius:6px;padding:4px 10px;font-size:11px;
                        font-weight:700;letter-spacing:0.05em;margin-bottom:16px;
                        font-family:'Courier New',monospace;">
              ✓ PROCESSED
            </div>
            <h1 style="font-size:26px;color:#1a1a1a;margin:0 0 8px;
                       font-family:Georgia,serif;line-height:1.2;">
              {filename}
            </h1>
            <p style="font-size:14px;color:{BRAND_MUTED};margin:0 0 24px;
                       font-family:'Courier New',monospace;">
              {node_count.toLocaleString()} memory nodes indexed
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
              Your document has been fully processed and added to your knowledge
              graph. Conflicts (if any) will appear in your Memory Inbox for review.
            </p>
            <!-- CTA -->
            <a href="https://ravenbase.app/dashboard/graph"
               style="display:inline-block;background:{BRAND_GREEN};color:#ffffff;
                      text-decoration:none;padding:14px 32px;border-radius:9999px;
                      font-size:14px;font-weight:600;margin-bottom:32px;">
              View Knowledge Graph →
            </a>
            <p style="font-size:12px;color:{BRAND_MUTED};
                       border-top:1px solid #e5e7eb;padding-top:24px;margin:0;line-height:1.6;">
              <a href="https://ravenbase.app/privacy"
                 style="color:{BRAND_GREEN};text-decoration:none;">Privacy Policy</a>
              &nbsp;·&nbsp;
              <span style="font-family:'Courier New',monospace;font-size:10px;">
                ◆ ALL_SYSTEMS_OPERATIONAL
              </span>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


═══════════════════════════════════════════════════════════════════
STEP 5 — CREATE EMAIL SERVICE (Phase 2d)
═══════════════════════════════════════════════════════════════════

FILE: src/services/email_service.py

"""
Email service — orchestrates all transactional emails via Resend.
AC-6: NEVER raise. Always catch and log at error level.
AC-7: Skip if RESEND_API_KEY absent (warning log).
AC-8: Skip if APP_ENV=test.
AC-9/AC-10: Handled in webhooks.py.
"""
from __future__ import annotations

import os
from structlog import get_logger

from src.adapters.resend_adapter import ResendAdapter
from src.templates.emails.welcome import render_welcome_email
from src.templates.emails.low_credits import render_low_credits_email
from src.templates.emails.ingestion_complete import render_ingestion_complete_email

log = get_logger()


class EmailService:
    """Sends all Ravenbase transactional emails."""

    def __init__(self, resend_adapter: ResendAdapter | None = None) -> None:
        self._resend = resend_adapter or ResendAdapter()

    # ------------------------------------------------------------------
    # AC-1 + AC-2: Welcome email
    # ------------------------------------------------------------------
    async def send_welcome(
        self,
        *,
        email: str,
        first_name: str,
        notify: bool = True,
    ) -> None:
        """
        Send welcome email to a new user.
        AC-7 check runs FIRST (before notify check per architecture constraint).
        AC-6: Non-fatal — never raises.
        """
        if os.getenv("APP_ENV") == "test":
            log.info("email.skipped", reason="APP_ENV=test", type="welcome")
            return

        if not notify:
            log.info("email.skipped", reason="user_preference", type="welcome")
            return

        if not os.getenv("RESEND_API_KEY"):
            log.warning("email.skipped", reason="RESEND_API_KEY_missing", type="welcome")
            return

        try:
            html = render_welcome_email(first_name=first_name)
            await self._resend.send(
                to=email,
                subject="Welcome to Ravenbase",
                html=html,
            )
            log.info("email.sent", type="welcome")
        except Exception as e:
            log.error("email.send_failed", type="welcome", error=str(e))
            # Never re-raise — AC-6: email failure is non-fatal

    # ------------------------------------------------------------------
    # AC-3: Low credits warning
    # ------------------------------------------------------------------
    async def send_low_credits(
        self,
        *,
        email: str,
        balance: int,
        plan_limit: int,
        notify: bool = True,
    ) -> None:
        """
        Send low credits warning.
        Called from credit_service after deduction when balance < 10%.
        AC-6: Non-fatal.
        """
        if os.getenv("APP_ENV") == "test":
            log.info("email.skipped", reason="APP_ENV=test", type="low_credits")
            return

        if not notify:
            log.info("email.skipped", reason="user_preference", type="low_credits")
            return

        if not os.getenv("RESEND_API_KEY"):
            log.warning("email.skipped", reason="RESEND_API_KEY_missing", type="low_credits")
            return

        try:
            html = render_low_credits_email(balance=balance, plan_limit=plan_limit)
            await self._resend.send(
                to=email,
                subject=f"You have {balance} credits remaining — Ravenbase",
                html=html,
            )
            log.info("email.sent", type="low_credits", balance=balance, plan_limit=plan_limit)
        except Exception as e:
            log.error("email.send_failed", type="low_credits", error=str(e))

    # ------------------------------------------------------------------
    # AC-4: Ingestion complete (large files > 2MB only)
    # ------------------------------------------------------------------
    async def send_ingestion_complete(
        self,
        *,
        email: str,
        filename: str,
        node_count: int,
        notify: bool = True,
    ) -> None:
        """
        Send ingestion completion notification.
        Only triggered for files > 2MB that reach COMPLETED status.
        AC-6: Non-fatal.
        """
        if os.getenv("APP_ENV") == "test":
            log.info("email.skipped", reason="APP_ENV=test", type="ingestion_complete")
            return

        if not notify:
            log.info("email.skipped", reason="user_preference", type="ingestion_complete")
            return

        if not os.getenv("RESEND_API_KEY"):
            log.warning("email.skipped", reason="RESEND_API_KEY_missing", type="ingestion_complete")
            return

        try:
            html = render_ingestion_complete_email(
                filename=filename,
                node_count=node_count,
            )
            await self._resend.send(
                to=email,
                subject=f"✓ {filename} has been processed — Ravenbase",
                html=html,
            )
            log.info("email.sent", type="ingestion_complete", filename=filename, node_count=node_count)
        except Exception as e:
            log.error("email.send_failed", type="ingestion_complete", error=str(e))


═══════════════════════════════════════════════════════════════════
STEP 6 — ADD RESEND WEBHOOK TO WEBHOOKS.PY (Phase 2e)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /fastapi-expert

Add to src/api/routes/webhooks.py:

```python
from svix import Webhook, WebhookVerificationError  # noqa: PLC0415
from src.core.config import settings
from src.services.email_service import EmailService
from src.models.user import User
from sqlalchemy import select

@router.post("/webhooks/resend")
async def handle_resend_webhook(request: Request, db: AsyncSession):
    """
    Handle Resend webhook events: email.bounced and email.complained.
    AC-9: email.bounced → disable specific notify_* flag by subject match.
    AC-10: email.complained → disable ALL notify_* flags.
    AC-11: Signature validated with svix. 403 on failure.
    """
    payload = await request.body()
    try:
        wh = Webhook(settings.RESEND_WEBHOOK_SECRET)
        event = wh.verify(
            payload,
            {
                "svix-id": request.headers.get("svix-id", ""),
                "svix-timestamp": request.headers.get("svix-timestamp", ""),
                "svix-signature": request.headers.get("svix-signature", ""),
            },
        )
    except WebhookVerificationError:
        raise HTTPException(status_code=403, detail="Invalid webhook signature")

    event_type = event.get("type", "")
    email_data = event.get("data", {}).get("email", {})
    to_email = (email_data.get("to") or [None])[0]
    subject = email_data.get("subject", "")

    if not to_email:
        return {"status": "ignored"}

    result = await db.execute(select(User).where(User.email == to_email))
    user = result.scalar_one_or_none()
    if not user:
        # Return 200 — Resend retries 5xx, 404 is not a 5xx
        return {"status": "user_not_found"}

    if event_type == "email.bounced":
        subject_lower = subject.lower()
        if "welcome" in subject_lower:
            user.notify_welcome = False
        elif "credit" in subject_lower:
            user.notify_low_credits = False
        elif "processed" in subject_lower or "complete" in subject_lower:
            user.notify_ingestion_complete = False
        await db.commit()
        log.warning(
            "email.bounced",
            user_id=str(user.id),
            subject=subject[:50],
        )

    elif event_type == "email.complained":
        # Spam complaint — most severe; disable ALL notifications
        user.notify_welcome = False
        user.notify_low_credits = False
        user.notify_ingestion_complete = False
        await db.commit()
        log.warning("email.complained", user_id=str(user.id))

    return {"status": "handled"}
```

═══════════════════════════════════════════════════════════════════
STEP 7 — INTEGRATE INTO EXISTING HANDLERS (Phase 2f)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /fastapi-expert

A. In src/api/routes/webhooks.py — user.created handler:
   After user is saved to DB and User record exists:
   ```python
   email_service = EmailService()
   await email_service.send_welcome(
       email=user.email,
       first_name=user.first_name or "there",
       notify=user.notify_welcome,
   )
   ```

B. In src/services/credit_service.py — deduct() method:
   After balance is updated and if balance < plan_limit * 0.1:
   Check if user.notify_low_credits and low_credits_email_sent_at not set this period:
   ```python
   email_service = EmailService()
   await email_service.send_low_credits(
       email=user.email,
       balance=user.credits_balance,
       plan_limit=user.plan_monthly_limit,
       notify=user.notify_low_credits,
   )
   ```

C. In src/workers/tasks/ingestion.py — after source reaches COMPLETED:
   If source.file_size_bytes > 2 * 1024 * 1024 (2MB):
   ```python
   email_service = EmailService()
   await email_service.send_ingestion_complete(
       email=user.email,
       filename=source.filename,
       node_count=node_count,
       notify=user.notify_ingestion_complete,
   )
   ```

═══════════════════════════════════════════════════════════════════
STEP 8 — VERIFY ALL 11 ACCEPTANCE CRITERIA (Phase 3)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /superpowers:verification-before-completion

For each AC, write a one-line verification result:

□ AC-1: Welcome email within 30s of user.created — VERIFIED (send_welcome() called in webhooks.py user.created handler)
□ AC-2: Welcome email has first_name, logo, CTA to /dashboard — VERIFIED (render_welcome_email() has all 3)
□ AC-3: Low credits email when balance < 10% — VERIFIED (credit_service calls send_low_credits after deduct())
□ AC-4: Ingestion complete for files > 2MB — VERIFIED (worker checks file_size_bytes > 2MB before calling)
□ AC-5: Brand colors in all templates — VERIFIED (BRAND_GREEN=#2d4a3e, BRAND_CREAM=#f5f3ee, from: Ravenbase)
□ AC-6: Non-fatal errors — VERIFIED (all send_* methods catch Exception and log.error, never re-raise)
□ AC-7: RESEND_API_KEY check — VERIFIED (each method checks os.getenv("RESEND_API_KEY") first)
□ AC-8: APP_ENV=test skip — VERIFIED (each method returns early if APP_ENV=test)
□ AC-9: email.bounced handler — VERIFIED (webhook disables specific notify_* by subject match)
□ AC-10: email.complained handler — VERIFIED (webhook disables ALL THREE notify_* flags)
□ AC-11: svix signature validation — VERIFIED (Webhook(settings.RESEND_WEBHOOK_SECRET).verify() called)
□ ResendAdapter lazy import — VERIFIED (import resend inside send() method body)
□ Templates use inline CSS — VERIFIED (no Tailwind, all inline style= attributes)

Run grep verification commands:
grep -n "RESEND_API_KEY" src/services/email_service.py
# Expected: 3 occurrences (one per method)
grep -n "APP_ENV.*test" src/services/email_service.py
# Expected: 3 occurrences (one per method)
grep -n "svix" src/api/routes/webhooks.py
# Expected: Webhook import + verify call
grep -rn "localStorage\|console.log\|print(" src/services/ src/adapters/ src/templates/
# Expected: 0 matches (backend, no browser APIs or print statements)

═══════════════════════════════════════════════════════════════════
STEP 9 — WRITE UNIT TESTS (Phase 3b)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /superpowers:test-driven-development

FILE: tests/unit/services/test_email_service.py

```python
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from src.services.email_service import EmailService


class TestEmailService:
    """Unit tests for EmailService. Covers AC-6, AC-7, AC-8."""

    @pytest.fixture
    def mock_resend(self):
        return AsyncMock()

    @pytest.fixture
    def service(self, mock_resend):
        return EmailService(resend_adapter=MagicMock(_configured=True, send=mock_resend))

    async def test_send_welcome_skips_when_notify_false(self, service, mock_resend):
        """AC-8 priority: user preference is checked after test env check."""
        with patch.dict("os.environ", {"APP_ENV": "development"}):
            await service.send_welcome(email="a@b.com", first_name="Test", notify=False)
        mock_resend.assert_not_called()

    async def test_send_welcome_skips_in_test_env(self, service, mock_resend):
        """AC-8: APP_ENV=test skips all sends."""
        with patch.dict("os.environ", {"APP_ENV": "test"}):
            await service.send_welcome(email="a@b.com", first_name="Test", notify=True)
        mock_resend.assert_not_called()

    async def test_send_welcome_skips_without_api_key(self, service, mock_resend):
        """AC-7: Missing RESEND_API_KEY skips sends."""
        with patch.dict("os.environ", {"APP_ENV": "development", "RESEND_API_KEY": ""}):
            await service.send_welcome(email="a@b.com", first_name="Test", notify=True)
        mock_resend.assert_not_called()

    async def test_send_welcome_success(self, service, mock_resend):
        """Happy path for welcome email."""
        with patch.dict("os.environ", {"APP_ENV": "development", "RESEND_API_KEY": "re_test_abc"}):
            await service.send_welcome(email="a@b.com", first_name="Alice", notify=True)
        mock_resend.assert_called_once()
        call_kwargs = mock_resend.call_args.kwargs
        assert "Welcome to Ravenbase" in call_kwargs["subject"]
        assert "Alice" in call_kwargs["html"]

    async def test_send_welcome_non_fatal_on_error(self, service, mock_resend):
        """AC-6: Errors are logged, never raised."""
        mock_resend.side_effect = RuntimeError("network error")
        with patch.dict("os.environ", {"APP_ENV": "development", "RESEND_API_KEY": "re_test_abc"}):
            # Must NOT raise
            await service.send_welcome(email="a@b.com", first_name="Test", notify=True)

    async def test_send_low_credits_non_fatal_on_error(self, service, mock_resend):
        """AC-6 applies to all email types."""
        mock_resend.side_effect = RuntimeError("network error")
        with patch.dict("os.environ", {"APP_ENV": "development", "RESEND_API_KEY": "re_test_abc"}):
            await service.send_low_credits(email="a@b.com", balance=50, plan_limit=1000, notify=True)
        # No exception raised

    async def test_send_ingestion_complete_non_fatal_on_error(self, service, mock_resend):
        """AC-6 applies to all email types."""
        mock_resend.side_effect = RuntimeError("network error")
        with patch.dict("os.environ", {"APP_ENV": "development", "RESEND_API_KEY": "re_test_abc"}):
            await service.send_ingestion_complete(email="a@b.com", filename="doc.pdf", node_count=42, notify=True)
```

═══════════════════════════════════════════════════════════════════
WHAT NOT TO DO (Anti-patterns — reject these on sight)
═══════════════════════════════════════════════════════════════════

❌ DO NOT import resend at module level — must be lazy inside method body
❌ DO NOT re-raise exceptions in email service — must catch, log.error, and swallow
❌ DO NOT log email addresses — log type and subject prefix only
❌ DO NOT include memory content, conflict text, or document text in email body
❌ DO NOT send welcome email if notify_welcome is False
❌ DO NOT send ingestion complete for files < 2MB (small files are instant)
❌ DO NOT send low credits email every deduction — only once per billing period
❌ DO NOT use print() — structlog only
❌ DO NOT use Resend sync client — use send_async() for non-blocking sends
❌ DO NOT return 500 from Resend webhook — return 200 and handle gracefully

═══════════════════════════════════════════════════════════════════
SUCCESS CRITERIA — ALL must be YES to report complete
═══════════════════════════════════════════════════════════════════

✅ resend>=2.5.0 added to pyproject.toml
✅ ResendAdapter created with lazy import pattern
✅ All 3 email template files created with brand colors
✅ EmailService created with all 3 send methods, non-fatal error handling
✅ POST /webhooks/resend handler with svix validation (AC-11)
✅ email.bounced handler disables specific notify_* flag (AC-9)
✅ email.complained handler disables ALL notify_* flags (AC-10)
✅ send_welcome() called in user.created webhook handler
✅ send_low_credits() called in credit_service after deduction
✅ send_ingestion_complete() called in worker for files > 2MB
✅ Unit tests written and pass
✅ make quality && make test passes

Show plan first. Do not implement yet.
```

---

## Frontend Agent Brief

> **Skill Invocations — invoke each skill before the corresponding phase:**
>
> **Phase 1 (Read/Design):** `Use /frontend-design — enforce production-grade aesthetic compliance`
> **Phase 2 (Components):** `Use /tailwindcss — for Tailwind CSS v4 token system`
> **Phase 3 (Settings UI):** `Use /tailwindcss-advanced-layouts — for settings page layout patterns`
> **Phase 4 (Accessibility):** `Use /tailwindcss-animations — for micro-interaction verification`
> **Phase 5 (Verification):** `Use /superpowers:verification-before-completion — before claiming done`

---

```
🎯 Target: Claude Code / MiniMax-M2.7 — Ultra-detailed planning and implementation
💡 Optimization: MiniMax-M2.7 directive — WRITE EVERYTHING IN MAXIMUM DETAIL.
   Complete code for every component. Complete grep commands for every AC.

═══════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════

Ravenbase Frontend: Next.js 15 App Router + Tailwind CSS v4 + shadcn/ui + TanStack Query
Design system: CSS variables only (no hardcoded hex). Brand: Primary=#2d4a3e, Background=#f5f3ee
Page to build: app/(dashboard)/settings/notifications/page.tsx
API endpoints used:
  GET /v1/users/me  → current user notification preferences
  PATCH /v1/users/me/notification-prefs → update preferences
  POST /v1/notification-prefs/test/:type → send test email

Notification types:
  - welcome: "Welcome email" (first email after signup)
  - low_credits: "Low credits warning" (triggers at < 10% balance)
  - ingestion_complete: "Processing complete" (files > 2MB)

═══════════════════════════════════════════════════════════════════
READING ORDER
═══════════════════════════════════════════════════════════════════

INVOKE: Use /frontend-design

Read ALL files. Write "✅ CONFIRMED READ: [filename]" after each:

1. CLAUDE.md — all 19 rules
2. docs/design/AGENT_DESIGN_PREAMBLE.md
   → Anti-patterns to reject:
     ❌ bg-[#2d4a3e] → bg-primary
     ❌ rounded-lg on cards → rounded-2xl
     ❌ rounded-md on CTAs → rounded-full
     ❌ <form> tag → onClick + controlled inputs
3. docs/design/00-brand-identity.md — mono label ◆ PATTERN, logo usage
4. docs/design/01-design-system.md — brand colors, typography, radius scale
5. docs/stories/EPIC-08-polish/STORY-032.md (this file — all ACs)

═══════════════════════════════════════════════════════════════════
STEP 1 — VERIFY API CLIENT GENERATED (Phase 1a)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /tailwindcss

Check if notification preference types exist in the API client:

grep -n "NotificationPrefs\|notification_prefs\|notify_welcome" \
  src/lib/api-client/ --include="*.ts" -r

Expected output: types found in schemas

If NOT found — run the generate-client command:
npm run generate-client

Then grep again to confirm.

Also verify the test endpoint exists:
grep -n "test.*email\|notification.*test" src/lib/api-client/ -r

═══════════════════════════════════════════════════════════════════
STEP 2 — CREATE SETTINGS NOTIFICATIONS PAGE (Phase 2a)
═══════════════════════════════════════════════════════════════════

FILE: app/(dashboard)/settings/notifications/page.tsx

"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Mail, Zap, FileCheck, Bell, BellOff, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface NotificationPrefs {
  notify_welcome: boolean
  notify_low_credits: boolean
  notify_ingestion_complete: boolean
}

// ------------------------------------------------------------------
// Email Preview Card — shared sub-component
// ------------------------------------------------------------------
function EmailPreviewCard({
  type,
  label,
  description,
  previewLines,
  testMutation,
  currentEmail,
}: {
  type: "welcome" | "low_credits" | "ingestion_complete"
  label: string
  description: string
  previewLines: string[]
  testMutation: ReturnType<typeof useMutation>
  currentEmail: string
}) {
  const isSending = testMutation.isPending

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            {type === "welcome" && <Mail className="w-5 h-5 text-primary" />}
            {type === "low_credits" && <Zap className="w-5 h-5 text-warning" />}
            {type === "ingestion_complete" && <FileCheck className="w-5 h-5 text-success" />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{label}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {/* Test button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            testMutation.mutate({ type }),
          }
          disabled={isSending}
          className="rounded-full text-xs h-8 px-3"
        >
          {isSending ? (
            <>
              <span className="mr-1.5 inline-block w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            "Send test"
          )}
        </Button>
      </div>

      {/* Email preview mockup */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Email header bar */}
        <div className="bg-primary px-4 py-3 flex items-center gap-2">
          <span className="text-primary-foreground text-xs font-mono tracking-wider">
            RAVENBASE
          </span>
          <span className="text-primary-foreground/40 text-xs">·</span>
          <span className="text-primary-foreground/60 text-xs font-mono">
            WHAT HAPPENED, WHERE, AND WHEN. ALWAYS.
          </span>
        </div>
        {/* Email body mockup */}
        <div className="bg-background p-4 space-y-2">
          {previewLines.map((line, i) => (
            <p
              key={i}
              className={`text-xs ${
                i === 0 ? "font-serif text-base font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Toggle Row — shared sub-component
// ------------------------------------------------------------------
function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  icon,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {checked ? (
          <CheckCircle2 className="w-4 h-4 text-success mr-2" />
        ) : (
          <BellOff className="w-4 h-4 text-muted-foreground mr-2" />
        )}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Main Page
// ------------------------------------------------------------------
export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: prefs, isLoading } = useQuery<NotificationPrefs>({
    queryKey: ["notification-prefs"],
    queryFn: () => apiFetch<NotificationPrefs>("/v1/users/me/notification-prefs"),
    staleTime: 60_000,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<NotificationPrefs>) =>
      apiFetch("/v1/users/me/notification-prefs", {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-prefs"] })
      toast.success("Preferences saved")
    },
    onError: () => {
      toast.error("Failed to save preferences. Please try again.")
    },
  })

  const testMutation = useMutation({
    mutationFn: ({ type }: { type: "welcome" | "low_credits" | "ingestion_complete" }) =>
      apiFetch(`/v1/notification-prefs/test/${type}`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Test email sent. Check your inbox.")
    },
    onError: () => {
      toast.error("Failed to send test email. Check your Resend API key in .env.")
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl text-foreground">Notification Preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which emails Ravenbase sends you.
        </p>
      </div>

      {/* ◆ EMAIL_NOTIFICATIONS section label */}
      <div>
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          ◆ EMAIL_NOTIFICATIONS
        </span>

        {/* Toggle rows */}
        <div className="bg-card rounded-2xl border border-border px-6 mt-3">
          <ToggleRow
            label="Welcome email"
            description="Sent once when you create your account"
            icon={<Mail className="w-4 h-4 text-primary" />}
            checked={prefs?.notify_welcome ?? true}
            onCheckedChange={(checked) =>
              updateMutation.mutate({ notify_welcome: checked })
            }
          />
          <ToggleRow
            label="Low credits warning"
            description="Sent when your balance falls below 10%"
            icon={<Zap className="w-4 h-4 text-warning" />}
            checked={prefs?.notify_low_credits ?? true}
            onCheckedChange={(checked) =>
              updateMutation.mutate({ notify_low_credits: checked })
            }
          />
          <ToggleRow
            label="Processing complete"
            description="Sent when large file uploads finish (files over 2MB)"
            icon={<FileCheck className="w-4 h-4 text-success" />}
            checked={prefs?.notify_ingestion_complete ?? true}
            onCheckedChange={(checked) =>
              updateMutation.mutate({ notify_ingestion_complete: checked })
            }
          />
        </div>
      </div>

      {/* ◆ EMAIL_PREVIEW section label */}
      <div>
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          ◆ EMAIL_PREVIEW
        </span>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Click "Send test" to receive a sample of each email at your account address.
        </p>

        <div className="grid grid-cols-1 gap-4">
          <EmailPreviewCard
            type="welcome"
            label="Welcome Email"
            description="Your first email from Ravenbase"
            previewLines={[
              "Welcome, [Your Name].",
              "Your exocortex is ready. Start by uploading your notes...",
              "[Open Ravenbase → CTA button]",
            ]}
            testMutation={testMutation}
            currentEmail={""}
          />
          <EmailPreviewCard
            type="low_credits"
            label="Low Credits Warning"
            description="Triggers when balance drops below 10%"
            previewLines={[
              "[X] credits remaining.",
              "[Credit usage bar]",
              "[Upgrade to Pro → CTA button]",
            ]}
            testMutation={testMutation}
            currentEmail={""}
          />
          <EmailPreviewCard
            type="ingestion_complete"
            label="Processing Complete"
            description="Sent when files over 2MB finish processing"
            previewLines={[
              "[filename].pdf — ✓ PROCESSED",
              "[X] memory nodes indexed",
              "[View Knowledge Graph → CTA button]",
            ]}
            testMutation={testMutation}
            currentEmail={""}
          />
        </div>
      </div>
    </div>
  )
}

═══════════════════════════════════════════════════════════════════
STEP 3 — CREATE LOADING STATE (Phase 2b)
═══════════════════════════════════════════════════════════════════

FILE: app/(dashboard)/settings/notifications/loading.tsx

import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsLoading() {
  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      {/* Toggle section skeleton */}
      <div>
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="bg-card rounded-2xl border border-border px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="w-10 h-6 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <Skeleton className="w-10 h-6 rounded-full" />
          </div>
        </div>
      </div>
      {/* Preview section skeleton */}
      <div>
        <Skeleton className="h-4 w-36 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

═══════════════════════════════════════════════════════════════════
STEP 4 — ADD TO SETTINGS LAYOUT NAV (Phase 2c)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /tailwindcss-advanced-layouts

If there is a settings layout or sidebar with settings navigation:
Add a link to "/settings/notifications" with bell icon.

Grep to find the settings navigation:
grep -rn "settings" app/\(dashboard\)/layout.tsx app/\(dashboard\)/settings/

═══════════════════════════════════════════════════════════════════
STEP 5 — VERIFY ALL FRONTEND ACCEPTANCE CRITERIA (Phase 3)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /superpowers:verification-before-completion

For each AC, write a one-line verification result:

□ Page: notifications/page.tsx created with bg-card rounded-2xl
□ EmailPreviewCard: 3 cards rendered (welcome, low_credits, ingestion_complete)
□ EmailPreviewCard: each has green header (bg-primary), preview body (bg-background)
□ ToggleRow: 3 toggles for notify_welcome, notify_low_credits, notify_ingestion_complete
□ Switch: shadcn Switch component, className="data-[state=checked]:bg-primary"
□ Send test button: rounded-full bg-primary text-sm h-8 px-3
□ Send test loading state: spinner + "Sending..." text
□ TanStack Query: useQuery for prefs, useMutation for update and test
□ toast.success on test email sent
□ toast.error on test email failure
□ toast.success on preference saved
□ loading.tsx: skeleton matching page structure
□ No <form> tags — all via onClick/onCheckedChange
□ All className strings use CSS variables (bg-primary, not #2d4a3e)
□ rounded-2xl on all cards
□ rounded-full on primary CTAs (Send test button)
□ loading.tsx has aria-busy or role="status" equivalent via Skeleton

Run grep verification:
grep -rn "className.*#2d4a3e\|className.*#f5f3ee" app/\(dashboard\)/settings/notifications/
# Expected: 0 matches (must use CSS variables only)

grep -rn "<form" app/\(dashboard\)/settings/notifications/
# Expected: 0 matches (no form tags per RULE 1)

grep -n "notifications" app/\(dashboard\)/settings/
# Expected: page.tsx + loading.tsx found

═══════════════════════════════════════════════════════════════════
WHAT NOT TO DO (Anti-patterns — reject these on sight)
═══════════════════════════════════════════════════════════════════

❌ DO NOT use bg-[#2d4a3e] in any className — use bg-primary
❌ DO NOT use bg-[#f5f3ee] in any className — use bg-background
❌ DO NOT use rounded-lg on cards — must be rounded-2xl
❌ DO NOT use rounded-md on Send test button — must be rounded-full
❌ DO NOT use <form onSubmit> — use onClick + controlled inputs only
❌ DO NOT use console.log() — use toast or ignore
❌ DO NOT hardcode email addresses in test emails
❌ DO NOT use default TanStack Query staleTime — must set per-query staleTime
❌ DO NOT show blank loading state — must have loading.tsx with skeleton
❌ DO NOT use plain <button> for Send test — use shadcn Button component

═══════════════════════════════════════════════════════════════════
SUCCESS CRITERIA — ALL must be YES to report complete
═══════════════════════════════════════════════════════════════════

✅ app/(dashboard)/settings/notifications/page.tsx created
✅ app/(dashboard)/settings/notifications/loading.tsx created
✅ 3 EmailPreviewCard components with green header + preview body
✅ 3 ToggleRow components with Switch (forest green when on)
✅ Send test button: rounded-full, loading state with spinner
✅ TanStack Query: useQuery for prefs, useMutation for update + test
✅ toast.success/toast.error on all mutation outcomes
✅ All className strings use CSS variables (0 hardcoded hex)
✅ npm run build passes (0 TypeScript errors)
✅ No <form> tags anywhere on the page

Show plan first. Do not implement yet.
```

---

## Development Loop

Follow the full loop defined in `docs/DEVELOPMENT_LOOP.md`.

```bash
# Backend:
make quality && make test
git add -A && git commit -m "feat(ravenbase): STORY-032 transactional email system (Resend)"
git push
# Edit docs/stories/epics.md → 🔲 → ✅ for STORY-032
git add docs/stories/epics.md docs/.bmad/project-status.md
git commit -m "docs: mark STORY-032 complete"
git push
```
