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

```
Implement STORY-033: Legal Pages (Privacy Policy, Terms of Service, Cookie Consent).

Read FIRST — read every file listed below completely before writing any code:
1. CLAUDE.md (all 19 frontend rules — especially RULE 5: route groups, RULE 15: metadata, RULE 16: skip links)
2. docs/design/AGENT_DESIGN_PREAMBLE.md — NON-NEGOTIABLE visual rules.
   Anti-patterns to REJECT on sight:
   - Hardcoded hex colors in JSX (use CSS variables only)
   - Rounded-lg on cards (use rounded-2xl)
   - No metadata export on a page (required for all marketing pages)
   - Missing skip link as first focusable element
3. docs/design/00-brand-identity.md — brand colors, mono labels
4. docs/design/01-design-system.md — all color tokens, typography
5. docs/design/CLAUDE_FRONTEND.md — SEO spec for legal pages, sitemap rules
6. docs/stories/EPIC-07-marketing/STORY-021.md — marketing layout and footer to extend
7. docs/stories/EPIC-08-polish/STORY-033.md (this file — all ACs)

SPECIFIC IMPLEMENTATION STEPS:

Step 1 — Check if pages already exist:
ls app/\(marketing\)/privacy/ 2>/dev/null && echo "EXISTS" || echo "CREATE"
ls app/\(marketing\)/terms/ 2>/dev/null && echo "EXISTS" || echo "CREATE"
If they exist, verify they are complete (Header + Footer + semantic content).
If they don't exist, create them following Step 2-3.

Step 2 — Create app/(marketing)/privacy/page.tsx:
This must be a Server Component (no "use client") — pure SSG.

import type { Metadata } from "next"
import { Header } from "@/components/marketing/Header"
import { Footer } from "@/components/marketing/Footer"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ravenbase collects, uses, and protects your personal data.",
  robots: { index: true, follow: true },  // AC-8: must be crawlable
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>
      <main id="main-content" className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-16">
          <header className="mb-12">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-4">
              ◆ LEGAL  {/* AC-5: mono label above h1 */}
            </p>
            <h1 className="font-serif text-5xl leading-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              Last updated: April 2026
            </p>
          </header>

          <section aria-labelledby="what-we-collect" className="mb-12">
            <h2 id="what-we-collect" className="font-serif text-2xl mb-4">
              What We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {/* Placeholder: describe account data, content data, usage data */}
            </p>
          </section>

          {/* AC-5: Additional sections: How We Use It, Data Retention,
               Your Rights (GDPR/PDPA), Contact Us — each with mono label ◆ SECTION */}
        </article>
      </main>
      <Footer />
    </div>
  )
}

Typography requirements (AC-5):
- h1: font-serif text-5xl (Playfair Display)
- h2: font-serif text-2xl
- Mono label above each h2: text-xs font-mono text-muted-foreground tracking-wider
- Body: font-sans text-base leading-relaxed text-foreground
- Effective date: font-mono text-xs text-muted-foreground

Step 3 — Create app/(marketing)/terms/page.tsx:
Same structure as privacy page. Different h1 and different sections (AC-6):
- Acceptance of Terms
- Service Description
- User Responsibilities
- Payment Terms
- Limitation of Liability
- Governing Law

Each section: font-serif h2 + ◆ SECTION_NAME mono label + placeholder paragraph.

Step 4 — Verify/update Footer component:
Open components/marketing/Footer.tsx.
Confirm it has a <nav aria-label="Legal navigation"> with:
- <Link href="/privacy">Privacy Policy</Link>
- <Link href="/terms">Terms of Service</Link>
These must be visible links, not commented out.

Step 5 — Check sitemap.ts:
Verify /privacy and /terms are included in sitemap (AC-3):
curl http://localhost:3000/sitemap.xml | grep -E "privacy|terms"

Step 6 — Cookie Consent Banner:
Check if app/(marketing)/layout.tsx already has CookieConsent.
If not, create components/marketing/CookieConsent.tsx:

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
      className="fixed bottom-0 left-0 right-0 z-50
                 bg-card border-t border-border p-4
                 shadow-lg"
    >
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm flex-1 text-center sm:text-left">
          We use analytics cookies to improve Ravenbase.
          Essential cookies (authentication) are always active.{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={accept} className="rounded-full bg-primary">
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={decline} className="rounded-full">
            Decline
          </Button>
        </div>
      </div>
    </div>
  )
}

Add to app/(marketing)/layout.tsx:
import { CookieConsent } from "@/components/marketing/CookieConsent"
Place <CookieConsent /> before </body> or after <Header>.

AC-7 checklist:
□ CookieConsent is "use client"
□ Only renders if NEXT_PUBLIC_POSTHOG_KEY is set
□ Stores consent in localStorage key 'ravenbase-cookie-consent'
□ Does NOT block page interaction (fixed bottom, not modal)
□ Accept and Decline buttons both work

Step 7 — Accessibility verification (AC-8):
Both /privacy and /terms must:
□ Export metadata with robots: { index: true, follow: true }
□ Have skip link as first focusable element
□ Have <main id="main-content">
□ Have semantic h1 → h2 hierarchy
□ Have all images with alt text (there may be 0 images on legal pages)

WHAT NOT TO DO:
- DO NOT use hardcoded hex colors — use bg-background, bg-card, text-muted-foreground
- DO NOT use rounded-lg on cards — use rounded-2xl
- DO NOT make cookie consent a modal — use fixed bottom banner
- DO NOT write actual legal language — use clearly marked placeholders
- DO NOT make pages dynamic — they must be SSG (no async data fetching)

AC CHECKLIST (all must be verified):
□ /privacy page: Header + Footer + semantic article with h1+h2
□ /terms page: Header + Footer + semantic article with h1+h2
□ Both: font-serif on h1 and h2, ◆ mono label above each h2
□ Both: metadata export with robots: { index: true, follow: true }
□ Footer: <nav aria-label="Legal navigation"> with /privacy and /terms links
□ sitemap.xml includes /privacy and /terms
□ CookieConsent: "use client", conditional on PostHog, localStorage persistence
□ CookieConsent: fixed bottom banner, not modal, does not block page interaction

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
