# STORY-033: Legal Pages (Privacy Policy, Terms of Service, Cookie Consent)

**Epic:** EPIC-08 — Polish & Production Hardening
**Priority:** P0 (legal prerequisite — must be complete before first EU user or payment processor review)
**Complexity:** Small
**Depends on:** STORY-021 (marketing layout and footer must exist)

---

## Functional Requirements
<!-- Which FR acceptance criteria does this story satisfy? -->
None — legal pages story (Privacy Policy, Terms of Service, Cookie Consent).

## Component
UI/Polish

---

> **Before You Start This Story — Read These Files First:**
> 1. `CLAUDE.md` (frontend rules — RULE 5: route groups don't force color mode)
> 2. `docs/design/CLAUDE_FRONTEND.md` — SEO spec (legal pages are SSG, indexable)
> 3. `docs/stories/EPIC-07-marketing/STORY-021.md` — marketing layout and footer to extend

---

## User Story
As a visitor about to sign up, I want to read Ravenbase's Privacy Policy so I can decide whether to share my data.
As a paying customer, I want to read the Terms of Service so I understand the agreement.
As an EU user, I need to see a cookie consent notice before any tracking cookies are set.

## Context
**Why this is P0:** GDPR Article 13 requires a Privacy Policy to be linked and available before collecting personal data (email address at registration). Without it, the registration form is technically non-compliant. UK GDPR and Thailand PDPA have the same requirement. Stripe also requires a linked Privacy Policy and Terms of Service before activating production payments.

**Scope of this story:** The story creates the page structure and placeholder copy. Legal copy will be reviewed and finalized by a human before launch — the agent creates the correct structure, not the final legal language.

**Cookie consent:** Ravenbase uses Clerk (essential auth cookies) and optionally PostHog (analytics). Essential cookies are exempt from consent under GDPR. If PostHog is enabled (`NEXT_PUBLIC_POSTHOG_KEY` is set), a consent banner is required before loading PostHog.

## Acceptance Criteria
- [ ] AC-1: `app/(marketing)/privacy/page.tsx` exists and renders at `/privacy` with a `<main>` element containing an `<article>` with headings h1-h3 in logical order
- [ ] AC-2: `app/(marketing)/terms/page.tsx` exists and renders at `/terms` with the same semantic structure
- [ ] AC-3: Both pages are statically generated (SSG), included in `app/sitemap.ts`, and export correct `metadata` with title and description
- [ ] AC-4: The marketing layout footer (`components/marketing/Footer.tsx`) has visible links to `/privacy` and `/terms` in a `<nav aria-label="Legal navigation">` element
- [ ] AC-5: Privacy Policy page includes these sections as h2 headings: "What We Collect", "How We Use It", "Data Retention", "Your Rights (GDPR/PDPA)", "Contact Us" — with placeholder copy under each
- [ ] AC-6: Terms of Service page includes these sections as h2 headings: "Acceptance of Terms", "Service Description", "User Responsibilities", "Payment Terms", "Limitation of Liability", "Governing Law" — with placeholder copy under each
- [ ] AC-7: A cookie consent banner component exists (`components/marketing/CookieConsent.tsx`) that: (a) shows only if `NEXT_PUBLIC_POSTHOG_KEY` is set, (b) stores consent in localStorage key `ravenbase-cookie-consent`, (c) only loads PostHog after consent is given, (d) has Accept and Decline buttons, (e) links to the Privacy Policy
- [ ] AC-8: The Privacy Policy page exports metadata with `robots: { index: true, follow: true }` so it is crawlable by Google (required for trust signals)

## Technical Notes

### Files to Create
- `app/(marketing)/privacy/page.tsx` — Privacy Policy page
- `app/(marketing)/terms/page.tsx` — Terms of Service page
- `components/marketing/CookieConsent.tsx` — Cookie consent banner (conditional on PostHog)

### Files to Modify
- `components/marketing/Footer.tsx` — add legal nav links
- `app/sitemap.ts` — verify `/privacy` and `/terms` are already included (they should be from STORY-021)
- `app/(marketing)/layout.tsx` — add `<CookieConsent />` component

### Page Structure Pattern

```tsx
// app/(marketing)/privacy/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ravenbase collects, uses, and protects your personal data.",
  robots: { index: true, follow: true },
}

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <article>
        <header className="mb-12">
          <p className="text-xs font-mono text-muted-foreground tracking-wider mb-4">
            ◆ LEGAL
          </p>
          <h1 className="font-serif text-5xl leading-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {/* Update this date before launch */}
          </p>
        </header>

        <section aria-labelledby="what-we-collect">
          <h2 id="what-we-collect" className="font-serif text-2xl mt-12 mb-4">
            What We Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {/* Placeholder: describe account data, content data, usage data */}
          </p>
        </section>

        <section aria-labelledby="how-we-use-it">
          <h2 id="how-we-use-it" className="font-serif text-2xl mt-12 mb-4">
            How We Use It
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {/* Placeholder: describe service operation, AI processing, no sale of data */}
          </p>
        </section>

        {/* Additional sections following same pattern:
            Data Retention, Your Rights (GDPR/PDPA), Contact Us */}
      </article>
    </main>
  )
}
```

### Cookie Consent Component

```tsx
// components/marketing/CookieConsent.tsx
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const CONSENT_KEY = "ravenbase-cookie-consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if PostHog is configured AND consent not yet given
    const hasPostHog = !!process.env.NEXT_PUBLIC_POSTHOG_KEY
    const hasConsent = localStorage.getItem(CONSENT_KEY) !== null
    setVisible(hasPostHog && !hasConsent)
  }, [])

  if (!visible) return null

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted")
    setVisible(false)
    // PostHog will be loaded on next page navigation after consent
    // (check localStorage before initializing PostHog in analytics.tsx)
  }

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined")
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm
                 z-50 bg-card border border-border rounded-2xl p-5 shadow-lg"
    >
      <p id="cookie-consent-title" className="font-medium text-sm mb-2">
        Cookie preferences
      </p>
      <p id="cookie-consent-desc" className="text-xs text-muted-foreground mb-4 leading-relaxed">
        We use analytics cookies to improve Ravenbase. Essential cookies (authentication)
        are always active. See our{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={accept} className="flex-1">Accept</Button>
        <Button size="sm" variant="outline" onClick={decline} className="flex-1">Decline</Button>
      </div>
    </div>
  )
}
```

### Architecture Constraints
- Legal pages are 100% static (SSG) — no server-side data fetching
- Cookie consent must NOT use `useSearchParams` or any dynamic data — pure client state
- Placeholder copy must be clearly marked with `{/* Placeholder: ... */}` comments so a human knows what to fill in
- The cookie consent banner must NOT block page interaction (fixed bottom, not modal)
- PostHog must never initialize if consent is `"declined"` or absent

## UX & Visual Quality Requirements

### Legal Page Visual Requirements
1. Both /privacy and /terms must use:
   - Header component (same as landing page)
   - Footer component (same as landing page)
   - bg-background (#f5f3ee) page background
   - Max width container: max-w-3xl mx-auto px-4 py-16

2. Typography:
   - h1: font-serif text-4xl (Playfair Display)
   - h2: font-serif text-2xl
   - Body text: font-sans text-base leading-relaxed text-foreground
   - Effective date: font-mono text-xs text-muted-foreground tracking-wider

3. Section headers must use ◆ SECTION_NAME mono label above each h2

4. If pages already exist (created in remediation plan), verify:
   - /privacy renders correctly with Header + Footer
   - /terms renders correctly with Header + Footer
   - Both linked in Footer component
   - Both in sitemap.ts
   If they do not exist, create them with full content.

5. Cookie consent banner (if not already present):
   Simple bottom-of-screen bar on first visit:
   "We use cookies to improve your experience. [Accept] [Decline]"
   - Store consent in localStorage key: 'ravenbase-cookie-consent'
   - Bar disappears after choice
   - bg-card border-t border-border p-4
   - Only shows on marketing pages, not dashboard

## Definition of Done
- [ ] `/privacy` and `/terms` pages render correctly with semantic structure
- [ ] Both pages appear in `app/sitemap.ts`
- [ ] Footer shows legal links in `<nav aria-label="Legal navigation">`
- [ ] Cookie consent banner shows only when PostHog is configured
- [ ] Placeholder copy sections clearly marked for human review before launch
- [ ] `npm run build` passes (0 TypeScript errors)
- [ ] Lighthouse: Accessibility > 95 on both pages

## Final Localhost Verification (mandatory before marking complete)

After `npm run build` passes and all tests pass, verify the running application works:

**Step 1 — Clear stale cache:**
```bash
rm -rf .next
```

**Step 2 — Start dev server:**
```bash
npm run dev
```

**Step 3 — Verify no runtime errors:**
- Open http://localhost:3000 in the browser
- Navigate to `/privacy` — confirm page renders correctly
- Navigate to `/terms` — confirm page renders correctly
- Confirm NO "Internal Server Error" or webpack runtime errors
- Confirm CSS loads correctly (no unstyled content)
- Open browser DevTools → Console tab
- Confirm no red errors (yellow warnings acceptable)

**Step 4 — Report one of:**
- ✅ `localhost verified` — pages render correctly
- ⚠️ `Issue found: [describe issue]` — fix before committing docs

Only commit the docs update (epics.md, story-counter, project-status, journal) AFTER localhost verification passes.

## Testing This Story

```bash
npm run build  # Must pass
npm run dev

# Verify pages render:
curl http://localhost:3000/privacy | grep "Privacy Policy"
curl http://localhost:3000/terms | grep "Terms of Service"

# Verify sitemap includes legal pages:
curl http://localhost:3000/sitemap.xml | grep "privacy"
curl http://localhost:3000/sitemap.xml | grep "terms"

# Verify footer links:
curl http://localhost:3000 | grep "/privacy"

# Cookie consent test:
# 1. Set NEXT_PUBLIC_POSTHOG_KEY=test_key in .env.local
# 2. Open http://localhost:3000 in browser
# 3. Verify banner appears
# 4. Click Accept → verify localStorage.getItem("ravenbase-cookie-consent") === "accepted"
# 5. Refresh → verify banner does not reappear
```

---

## Frontend Agent Brief

> **Skill Invocations — invoke each skill before the corresponding phase:**
>
> **Phase 1 (Read/Design):** `Use /frontend-design — enforce production-grade aesthetic compliance`
> **Phase 2 (Layout/Components):** `Use /tailwindcss-advanced-layouts — for layout structure patterns`
> **Phase 3 (Accessibility):** `Use /superpowers:verification-before-completion — before claiming done`
> **Before writing any TSX:** `Use /tailwindcss — for Tailwind CSS v4 token system`

---

```
🎯 Target: Claude Code / MiniMax-M2.7 — Ultra-detailed planning and implementation
💡 Optimization: MiniMax-M2.7 directive — WRITE EVERYTHING IN MAXIMUM DETAIL.
   Plans MUST be 1500-3000 lines. Never short-circuit with "see code below".
   Write complete explanations, complete code, complete verification commands.

═══════════════════════════════════════════════════════════════════
PLAN REQUIREMENTS FOR MiniMax-M2.7 (read before writing plan)
═══════════════════════════════════════════════════════════════════

When you enter plan mode for this story, your plan MUST contain:

A. FILE INVENTORY — list every file you will CREATE or MODIFY
   For each file: exact path, why it exists, what it contains

B. READING ORDER — confirm you will read ALL files in this exact order:
   1. CLAUDE.md (mandatory — all 19 rules)
   2. docs/design/AGENT_DESIGN_PREAMBLE.md
   3. docs/design/00-brand-identity.md
   4. docs/design/01-design-system.md
   5. docs/design/04-ux-patterns.md
   6. docs/stories/EPIC-07-marketing/STORY-021.md (existing marketing layout)
   7. docs/stories/EPIC-08-polish/STORY-033.md (this file)
   State for each: "CONFIRMED READ" after reading it.

C. PAGE DESIGN — for each page (privacy, terms), write out:
   - Exact JSX structure with all className strings
   - Exact heading hierarchy (h1 → h2 → h3)
   - Exact mono label pattern ◆ LABEL
   - Where Header and Footer are imported from
   - Where the page exports metadata
   - Why this page is SSG (no "use client")

D. COOKIE CONSENT DESIGN — complete component design:
   - Full state machine: what state exists, what transitions it
   - Full JSX with exact className strings for every element
   - Exact conditions for visibility
   - Exact localStorage key and values
   - Where in the layout it will be placed

E. FOOTER VERIFICATION — exact grep commands to verify legal nav links exist

F. ACCESSIBILITY PLAN — how skip link, main landmark, heading hierarchy are implemented

G. CODE COMPLETENESS — every function, hook, and component must have:
   - Complete TypeScript code (not pseudocode, not "// ... rest of code")
   - Exact import paths (e.g., @/components/marketing/Header)
   - Exact className strings with CSS variable usage

H. VERIFICATION COMMAND INVENTORY — list every grep/curl/test command
   that will prove each AC is satisfied

═══════════════════════════════════════════════════════════════════
STEP 1 — READ PHASE (mandatory — read every file, write CONFIRMED READ)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /frontend-design

Read ALL files in this exact order. For each, after reading, write:
"✅ CONFIRMED READ: [filename] — [one sentence of key constraint from this file]"

1. CLAUDE.md
   → All 19 rules. Critical: RULE 5 (route groups), RULE 15 (metadata export),
     RULE 16 (skip links), RULE 17 (aria-live for streaming).

2. docs/design/AGENT_DESIGN_PREAMBLE.md
   → Anti-patterns that are automatic rejections:
     ❌ Hardcoded hex in JSX → reject
     ❌ Rounded-lg on cards → must be rounded-2xl
     ❌ No metadata on marketing pages → required
     ❌ Missing skip link → required
     ❌ Cookie consent as modal → must be fixed bottom banner

3. docs/design/00-brand-identity.md
   → Mono label pattern: ◆ LABEL_NAME
   → Logo: use RavenbaseLogo/RavenbaseLockup components

4. docs/design/01-design-system.md
   → All 18 CSS variables for :root and .dark
   → Card style: bg-card rounded-2xl border border-border
   → CTA: rounded-full, bg-primary

5. docs/design/04-ux-patterns.md
   → Accessibility requirements
   → Animation timings if any

6. docs/stories/EPIC-07-marketing/STORY-021.md
   → Marketing layout structure (Header + Footer)
   → Footer nav pattern

7. docs/stories/EPIC-08-polish/STORY-033.md (this file)
   → All 8 ACs. Write them out in your plan.

═══════════════════════════════════════════════════════════════════
STEP 2 — PAGE AUDIT (check existing files before creating)
═══════════════════════════════════════════════════════════════════

Run these commands and record results:

# Check if privacy page exists:
ls -la app/\(marketing\)/privacy/page.tsx 2>/dev/null && echo "EXISTS" || echo "MISSING — must create"

# Check if terms page exists:
ls -la app/\(marketing\)/terms/page.tsx 2>/dev/null && echo "EXISTS" || echo "MISSING — must create"

# Check Footer for legal nav links:
grep -n "privacy\|terms" components/marketing/Footer.tsx | head -20

# Check sitemap for legal pages:
grep -n "privacy\|terms" app/sitemap.ts | head -10

# Check if CookieConsent already exists:
ls -la components/marketing/CookieConsent.tsx 2>/dev/null && echo "EXISTS" || echo "MISSING — must create"

Record all results. If a file exists, read it and verify it meets AC requirements.

═══════════════════════════════════════════════════════════════════
STEP 3 — PLAN: PRIVACY PAGE (if creating or fixing)
═══════════════════════════════════════════════════════════════════

If privacy page is MISSING — write complete page:

FILE: app/(marketing)/privacy/page.tsx

Complete code:

import type { Metadata } from "next"
import { Header } from "@/components/marketing/Header"
import { Footer } from "@/components/marketing/Footer"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ravenbase collects, uses, and protects your personal data.",
  robots: { index: true, follow: true },
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip link — first focusable element (RULE 16) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
                   focus:z-50 focus:px-4 focus:py-2 focus:bg-primary
                   focus:text-primary-foreground focus:rounded-md focus:font-medium
                   focus:text-sm"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-16">
          {/* Page header */}
          <header className="mb-12">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-4">
              ◆ LEGAL
            </p>
            <h1 className="font-serif text-5xl leading-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              Last updated: April 2026
            </p>
          </header>

          {/* Section 1 */}
          <section aria-labelledby="what-we-collect" className="mb-12">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">
              ◆ WHAT_WE_COLLECT
            </p>
            <h2 id="what-we-collect" className="font-serif text-2xl mb-4">
              What We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {/* Placeholder: describe account data (email, name, subscription tier),
                  content data (uploaded files, memory nodes, knowledge graph),
                  usage data (interaction logs, feature usage). */}
            </p>
          </section>

          {/* Section 2 */}
          <section aria-labelledby="how-we-use-it" className="mb-12">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">
              ◆ HOW_WE_USE_IT
            </p>
            <h2 id="how-we-use-it" className="font-serif text-2xl mb-4">
              How We Use It
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {/* Placeholder: service operation, AI processing, no sale of data. */}
            </p>
          </section>

          {/* Section 3 */}
          <section aria-labelledby="data-retention" className="mb-12">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">
              ◆ DATA_RETENTION
            </p>
            <h2 id="data-retention" className="font-serif text-2xl mb-4">
              Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {/* Placeholder: retention periods, deletion procedures. */}
            </p>
          </section>

          {/* Section 4 */}
          <section aria-labelledby="your-rights" className="mb-12">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">
              ◆ YOUR_RIGHTS
            </p>
            <h2 id="your-rights" className="font-serif text-2xl mb-4">
              Your Rights (GDPR/PDPA)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {/* Placeholder: access, rectification, erasure, portability,
                  right to withdraw consent, right to lodge complaint. */}
            </p>
          </section>

          {/* Section 5 */}
          <section aria-labelledby="contact-us" className="mb-12">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">
              ◆ CONTACT_US
            </p>
            <h2 id="contact-us" className="font-serif text-2xl mb-4">
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {/* Placeholder: DPO contact, data controller info. */}
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  )
}

Note: No "use client" — this is a Server Component (SSG). No async data fetching.

═══════════════════════════════════════════════════════════════════
STEP 4 — PLAN: TERMS PAGE (if creating or fixing)
═══════════════════════════════════════════════════════════════════

Same structure as privacy page. Replace h1 and sections:

H1: "Terms of Service"

Sections (each with ◆ SECTION_NAME mono label above h2):
1. Acceptance of Terms
2. Service Description
3. User Responsibilities
4. Payment Terms
5. Limitation of Liability
6. Governing Law

═══════════════════════════════════════════════════════════════════
STEP 5 — PLAN: FOOTER LEGAL NAV
═══════════════════════════════════════════════════════════════════

Read components/marketing/Footer.tsx.
Find the nav element.
Add <nav aria-label="Legal navigation"> if missing.
Add these links inside:
- <Link href="/privacy">Privacy Policy</Link>
- <Link href="/terms">Terms of Service</Link>

Verify with: grep -n "aria-label.*Legal\|privacy\|terms" components/marketing/Footer.tsx

═══════════════════════════════════════════════════════════════════
STEP 6 — PLAN: COOKIE CONSENT COMPONENT
═══════════════════════════════════════════════════════════════════

INVOKE: Use /tailwindcss-advanced-layouts

FILE: components/marketing/CookieConsent.tsx

"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const CONSENT_KEY = "ravenbase-cookie-consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // AC-7a: only show if PostHog is configured
    const hasPostHog = !!process.env.NEXT_PUBLIC_POSTHOG_KEY
    // AC-7b: only show if consent not yet given
    const hasConsent = localStorage.getItem(CONSENT_KEY) !== null
    setVisible(hasPostHog && !hasConsent)
  }, [])

  if (!visible) return null

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted")
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined")
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 left-0 right-0 z-50
                 bg-card border-t border-border p-4
                 shadow-lg"
    >
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 text-center sm:text-left">
          <p id="cookie-consent-title" className="text-sm font-medium text-foreground mb-1">
            Cookie preferences
          </p>
          <p id="cookie-consent-desc" className="text-xs text-muted-foreground leading-relaxed">
            We use analytics cookies to improve Ravenbase. Essential cookies
            (authentication) are always active.{" "}
            <Link
              href="/privacy"
              className="underline hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            onClick={accept}
            className="rounded-full bg-primary text-primary-foreground
                       hover:bg-primary/90 transition-colors
                       min-h-[44px] px-6"
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={decline}
            className="rounded-full border-border hover:bg-secondary
                       min-h-[44px] px-6"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  )
}

PLACEMENT: In app/(marketing)/layout.tsx, add:
import { CookieConsent } from "@/components/marketing/CookieConsent"
Add <CookieConsent /> right after <Header /> and before {children}.

═══════════════════════════════════════════════════════════════════
STEP 7 — PLAN: SITEMAP VERIFICATION
═══════════════════════════════════════════════════════════════════

Check app/sitemap.ts — confirm /privacy and /terms are present:
grep -n "privacy\|terms" app/sitemap.ts

Expected output should include entries for both /privacy and /terms.

═══════════════════════════════════════════════════════════════════
STEP 8 — ACCESSIBILITY VERIFICATION PLAN
═══════════════════════════════════════════════════════════════════

For both /privacy and /terms:

□ Skip link: first focusable element in DOM (after <body>)
□ Skip link: href="#main-content", targets id="main-content" on <main>
□ <main id="main-content"> exists exactly once per page
□ <article> contains all section content
□ Heading hierarchy: h1 → h2 → h3 (never skipped levels)
□ All sections have aria-labelledby pointing to their h2 id
□ Metadata export: robots: { index: true, follow: true }
□ Font check: h1 and h2 use className="font-serif"
□ Mono labels: ◆ prefix in text-xs font-mono text-muted-foreground tracking-wider

═══════════════════════════════════════════════════════════════════
STEP 9 — AC VERIFICATION COMMANDS
═══════════════════════════════════════════════════════════════════

Write these exact commands with expected results:

# AC-1: privacy page exists with semantic structure
grep -c "font-serif text-5xl" app/\(marketing\)/privacy/page.tsx
# Expected: 1

# AC-2: terms page exists with semantic structure
grep -c "font-serif text-5xl" app/\(marketing\)/terms/page.tsx
# Expected: 1

# AC-3: sitemap includes legal pages
grep -E "privacy|terms" app/sitemap.ts | wc -l
# Expected: >= 2

# AC-4: footer has legal nav
grep -c "aria-label.*Legal" components/marketing/Footer.tsx
# Expected: 1

# AC-5: privacy page has ◆ mono labels
grep -c "◆ " app/\(marketing\)/privacy/page.tsx
# Expected: >= 6 (one per section + page header)

# AC-6: terms page has 6 sections with h2
grep -c "font-serif text-2xl" app/\(marketing\)/terms/page.tsx
# Expected: 6

# AC-7a: CookieConsent is client component
grep -c '"use client"' components/marketing/CookieConsent.tsx
# Expected: 1

# AC-7b: CookieConsent checks PostHog key
grep -c "NEXT_PUBLIC_POSTHOG_KEY" components/marketing/CookieConsent.tsx
# Expected: 1

# AC-7c: CookieConsent uses correct localStorage key
grep -c "ravenbase-cookie-consent" components/marketing/CookieConsent.tsx
# Expected: >= 2

# AC-8: metadata exports robots index
grep -A2 "robots:" app/\(marketing\)/privacy/page.tsx
# Expected: index: true

═══════════════════════════════════════════════════════════════════
ANTI-PATTERNS — automatic rejection without asking
═══════════════════════════════════════════════════════════════════

❌ className="bg-white" in any component → must be bg-card or bg-background
❌ className="rounded-lg" on any card → must be rounded-2xl
❌ className with hardcoded hex color → must use CSS variable
❌ CookieConsent as <Dialog> or <Modal> → must be fixed bottom banner
❌ No metadata export on /privacy or /terms → required for SEO
❌ Marketing pages using "use client" for content → SSG server components
❌ Placeholder text without {/* Placeholder: */} comment → must be marked

═══════════════════════════════════════════════════════════════════
SUCCESS CRITERIA (ALL must be YES — invoke /superpowers:verification-before-completion)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /superpowers:verification-before-completion

✅ AC-1: /privacy page — Header + Footer + article with h1 + 5 sections
✅ AC-2: /terms page — Header + Footer + article with h1 + 6 sections
✅ AC-3: sitemap includes /privacy and /terms
✅ AC-4: Footer has <nav aria-label="Legal navigation"> with both links
✅ AC-5: Privacy page: ◆ LEGAL above h1, ◆ SECTION above each h2
✅ AC-6: Terms page: 6 sections each with ◆ SECTION above h2
✅ AC-7: CookieConsent — "use client", PostHog key check, localStorage persistence
✅ AC-8: Both pages export metadata with robots: { index: true, follow: true }
✅ Skip link as first focusable element on both pages
✅ <main id="main-content"> exactly once on both pages
✅ npm run build passes (0 TypeScript errors)
✅ No hardcoded hex colors in any component file

Show plan first. Do not implement yet.
```

---

## Development Loop

Follow the full loop defined in `docs/DEVELOPMENT_LOOP.md`.

```bash
npm run build && npm run test
git add -A && git commit -m "feat(ravenbase): STORY-033 legal pages and cookie consent"
git push
# Edit docs/stories/epics.md → 🔲 → ✅ for STORY-033
git add docs/stories/epics.md docs/.bmad/project-status.md
git commit -m "docs: mark STORY-033 complete"
git push
```
