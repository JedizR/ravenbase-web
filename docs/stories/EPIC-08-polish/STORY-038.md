# STORY-038 — Final UX Polish Pass

**Epic:** EPIC-08 — Polish & Production Hardening
**Priority:** P0 (must complete before launch)
**Complexity:** Large
**Sprint:** 38
**Depends on:** All stories STORY-031 through STORY-037 complete

---

## Functional Requirements
<!-- Which FR acceptance criteria does this story satisfies? -->
None — final UX polish and production hardening story.

## Component
All Components — cross-cutting audit

---

> **Before You Start This Story — Read These Files First:**
> 1. `CLAUDE.md` (all 19 frontend rules — read every rule carefully)
> 2. `docs/design/AGENT_DESIGN_PREAMBLE.md` — NON-NEGOTIABLE visual rules, anti-patterns, and pre-commit checklist. Read fully before writing any JSX. This is the single most important design file.
> 3. `docs/design/00-brand-identity.md` — brand colors, mono labels, voice rules, logo spec
> 4. `docs/design/01-design-system.md` — all color tokens, typography, component specs
> 5. `docs/design/02-component-library.md` — component anatomy and usage
> 6. `docs/design/04-ux-patterns.md` — interaction patterns, animations, micro-interactions
> 7. `docs/stories/epics.md` — confirm all 37 previous stories are marked ✅ before starting
> 8. `docs/.bmad/project-status.md` — confirm current sprint is 38

---

## User Story

As a pre-launch quality engineer, I want to perform a complete end-to-end audit of the
entire Ravenbase frontend so that every page feels polished, every interaction has
feedback, and every color matches the brand system — before real users see it.

---

## Context

STORY-038 is the final gate in Phase B (Frontend). All 37 preceding stories have been
implemented across 8 epics covering foundation, ingestion, knowledge graph, conflict
detection, meta-document generation, auth, marketing, and polish.

After 37 stories of implementation, visual drift accumulates:
- Hardcoded hex colors slip through code reviews
- Typography classes get applied inconsistently
- Animation timings diverge from spec
- Brand colors used in wrong contexts
- Pages built in isolation miss cross-page consistency
- Loading states are missing on async routes

This story corrects all of that in a single systematic pass.

**What this story IS NOT:**
- It is NOT a feature story — no new functionality is built
- It is NOT a bug fix story — it doesn't address specific bug reports
- It is NOT a performance optimization story — it doesn't refactor for speed

It is a **quality audit and surface correction pass** — verifying that what was built
matches the design system specification exactly.

---

## Acceptance Criteria

### AC-1: Brand Color Audit (0 hardcoded hex defects)
- [ ] AC-1a: Sidebar: `bg-primary` (#2d4a3e) in BOTH light and dark mode — never `bg-background`, never `bg-sidebar`
- [ ] AC-1b: Page background: `bg-background` (#f5f3ee light, #1a1a1a dark)
- [ ] AC-1c: All CTA buttons: `bg-primary rounded-full` — no `rounded-md` or `rounded-lg` on primary CTAs
- [ ] AC-1d: All cards: `bg-card rounded-2xl border border-border` — no `rounded-xl`, no `rounded-lg`
- [ ] AC-1e: Active nav items: `bg-primary-foreground/15 text-primary-foreground`
- [ ] AC-1f: Progress bars: `[&>div]:bg-primary` — forest green fill
- [ ] AC-1g: Focus rings: `ring-2 ring-primary/30` — forest green focus
- [ ] AC-1h: Conflict/warning badges: `bg-warning text-[var(--warning-foreground)]` — amber with dark text
- [ ] AC-1i: No hardcoded hex colors in any component file (`#2d4a3e`, `#f5f3ee`, `#e8ebe6`, `#a8c4b2`, `#ffc00d`)

**Verification method:** `grep -rn "#2d4a3e\|#f5f3ee\|#e8ebe6\|#ffc00d\|#a8c4b2\|#1a1a1a" components/ app/ --include="*.tsx" --include="*.ts"` — every match must be inside a CSS variable definition or a comment, never in a Tailwind className string.

### AC-2: Typography Audit (0 font-family defects)
- [ ] AC-2a: All page H1 headlines: `font-serif` (Playfair Display) — not `font-sans`
- [ ] AC-2b: All section H2 headlines: `font-serif`
- [ ] AC-2c: All body text: `font-sans` (DM Sans)
- [ ] AC-2d: All mono labels (◆ LABEL_NAME): `font-mono` (JetBrains Mono) — never `font-sans`
- [ ] AC-2e: All status chips and system identifiers: `font-mono`
- [ ] AC-2f: All code blocks: `font-mono`

### AC-3: Shape & Border Radius Audit (0 shape defects)
- [ ] AC-3a: All cards: `rounded-2xl` — never `rounded-lg`, never `rounded-xl`
- [ ] AC-3b: All primary CTA buttons: `rounded-full` — never `rounded-md`
- [ ] AC-3c: All dialog/modal content: `rounded-2xl`
- [ ] AC-3d: All input fields: `rounded-xl`

### AC-4: Micro-Interaction Audit (0 missing interactions)
Each item must be manually verified in browser at 1440px desktop:
- [ ] AC-4a: Primary buttons: `hover:-translate-y-px active:translate-y-0` lift on hover, press down on click
- [ ] AC-4b: Secondary buttons: `hover:bg-secondary` background color shift on hover
- [ ] AC-4c: Cards: `hover:shadow-md transition-shadow` shadow increase on hover
- [ ] AC-4d: Nav links in marketing header: underline grows from left on hover (`hover:bg-primary` is NOT a nav link style — use a bottom-border animation)
- [ ] AC-4e: Sidebar nav items: `hover:scale-110` icon scale on hover
- [ ] AC-4f: Inputs: `focus:ring-2 focus:ring-primary/30 focus:border-primary` forest green ring + border on focus
- [ ] AC-4g: Dropdown menus: `animate-in fade-in zoom-in-95` scale+fade on open
- [ ] AC-4h: Sonner toasts: `toast-swap` animation (built into sonner)
- [ ] AC-4i: Conflict cards: `slide-out-right` animation on resolve (animate.css or tw-animate-css)
- [ ] AC-4j: Progress bars: `transition-all duration-300 ease-out` width transition

### AC-5: Page-by-Page Functional Audit

**/login:**
- [ ] AC-5a: Clerk SignIn renders with Ravenbase brand lockup above (not generic Clerk styling)
- [ ] AC-5b: Background is warm cream `bg-background` (#f5f3ee) — NOT white
- [ ] AC-5c: After login → redirects to `/chat`

**/register:**
- [ ] AC-5d: Clerk SignUp renders with Ravenbase brand lockup above
- [ ] AC-5e: Background is warm cream `bg-background`
- [ ] AC-5f: After register → redirects to `/onboarding`

**/onboarding:**
- [ ] AC-5g: Step indicator shows "Step X of 3" with time estimate
- [ ] AC-5h: Role cards: `hover:-translate-y-1 hover:shadow-md` lift on hover, checkmark appears when selected
- [ ] AC-5i: "Nice to meet you, [Name]!" appears after name entry
- [ ] AC-5j: Step 3 progress bar: `bg-primary` forest green fill
- [ ] AC-5k: Confetti animation on completion (framer-motion)
- [ ] AC-5l: Redirects to `/chat?first_run=true` after completion

**/chat:**
- [ ] AC-5m: Empty state shows example prompt chips
- [ ] AC-5n: User messages: `bg-secondary rounded-2xl` right-aligned
- [ ] AC-5o: Assistant messages: `bg-card border border-border rounded-2xl` left-aligned
- [ ] AC-5p: Typing indicator (3 bouncing dots) while streaming
- [ ] AC-5q: Citations render as clickable `font-mono` cards below message
- [ ] AC-5r: Session list in sidebar updates after each conversation
- [ ] AC-5s: Input: Enter sends, Shift+Enter inserts newline

**/graph:**
- [ ] AC-5t: Cytoscape renders with forest green nodes (`#2d4a3e`)
- [ ] AC-5u: Clicking a node opens GraphNodePanel Sheet from right
- [ ] AC-5v: Filter bar: `bg-card rounded-2xl` container
- [ ] AC-5w: NL query bar appears above filter bar
- [ ] AC-5x: Query results highlight nodes in amber `bg-warning`
- [ ] AC-5y: Mobile: ConceptList renders instead of Cytoscape

**/workstation:**
- [ ] AC-5z: Prompt textarea expands on focus
- [ ] AC-5aa: Generate button: `bg-primary rounded-full`
- [ ] AC-5ab: Streaming output: blinking `▌` cursor
- [ ] AC-5ac: Auto-save indicator: `◆ SAVED_JUST_NOW` mono label after generation
- [ ] AC-5ad: Export MD and Export PDF buttons work
- [ ] AC-5ae: History sidebar lists previous documents
- [ ] AC-5af: Mobile: history in Sheet drawer

**/sources:**
- [ ] AC-5ag: Upload Files tab: IngestionDropzone is functional (not a placeholder)
- [ ] AC-5ah: Dropzone: dashed border, changes on drag-over
- [ ] AC-5ai: Import from AI Chat tab: prompt loads, copy button works
- [ ] AC-5aj: Import submit shows IngestionProgress SSE bar

**/inbox:**
- [ ] AC-5ak: Conflict cards render with OLD/NEW rows
- [ ] AC-5al: J/K navigates between cards
- [ ] AC-5am: Enter accepts, Backspace rejects
- [ ] AC-5an: C opens ConflictChat
- [ ] AC-5ao: ? shows ShortcutOverlay
- [ ] AC-5ap: Cards animate in on load, slide out on resolve
- [ ] AC-5aq: Empty state shows animated checkmark

**/settings:**
- [ ] AC-5ar: AI model cards: selected state has `border-2 border-primary`
- [ ] AC-5as: Notification toggles: `bg-primary` when on
- [ ] AC-5at: Profile CRUD: create/edit/delete all work

**/settings/billing:**
- [ ] AC-5au: Shows current tier (not just "Free")
- [ ] AC-5av: Pro/Team: "Manage subscription" opens Stripe portal
- [ ] AC-5aw: Free: "Upgrade to Pro" links to `/#pricing`

**/settings/referrals:**
- [ ] AC-5ax: Referral link displays correctly
- [ ] AC-5ay: Copy button shows 2s "COPIED!" state
- [ ] AC-5az: Stats card shows referral count

**/settings/data:**
- [ ] AC-5ba: Format selector shows 3 options
- [ ] AC-5bb: Export button triggers download
- [ ] AC-5bc: Delete account opens AlertDialog with "DELETE" confirmation input

**/ (landing page):**
- [ ] AC-5bd: All 9 sections render
- [ ] AC-5be: Pricing section accessible via /#pricing anchor
- [ ] AC-5bf: Scroll animations play on features section
- [ ] AC-5bg: Header nav links scroll to correct sections
- [ ] AC-5bh: CTA buttons link to `/register` (not `/dashboard`)
- [ ] AC-5bi: Footer Privacy + Terms links work

**/privacy and /terms:**
- [ ] AC-5bj: Both pages render with Header + Footer
- [ ] AC-5bk: No 404 errors

### AC-6: Accessibility Audit (WCAG 2.1 AA — 0 critical violations)
- [ ] AC-6a: Every page has skip-to-content link as first focusable element
- [ ] AC-6b: All images have alt text
- [ ] AC-6c: All interactive elements reachable via Tab key
- [ ] AC-6d: No keyboard traps
- [ ] AC-6e: aria-live regions on all streaming content
- [ ] AC-6f: `npx axe-cli http://localhost:3000` → 0 critical violations
- [ ] AC-6g: `npx axe-cli http://localhost:3000/onboarding` → 0 critical violations
- [ ] AC-6h: `npx axe-cli http://localhost:3000/graph` → 0 critical violations

### AC-7: Performance Audit
- [ ] AC-7a: `npm run build` passes: 0 TypeScript errors, 0 warnings
- [ ] AC-7b: `npm run test` passes: 0 test failures
- [ ] AC-7c: No `console.error` or `console.warn` in production code
- [ ] AC-7d: All heavy imports use dynamic import (cytoscape, react-markdown)
- [ ] AC-7e: All async dashboard routes have `loading.tsx` sibling files

### AC-8: Mobile Audit (test at 375px viewport)
- [ ] AC-8a: All touch targets ≥ 44px height
- [ ] AC-8b: No horizontal overflow on any page
- [ ] AC-8c: Sidebar renders as Sheet drawer
- [ ] AC-8d: Mobile menu opens and closes correctly
- [ ] AC-8e: Input keyboards don't cause layout shift
- [ ] AC-8f: Pricing cards stack vertically

---

## Technical Notes

### Development Sequence

**Phase 1: Global CSS and Brand Foundation (do FIRST)**
1. Run `grep -rn "#2d4a3e\|#f5f3ee\|#e8ebe6\|#ffc00d\|#a8c4b2\|#1a1a1a" components/ app/ --include="*.tsx" --include="*.ts"` — document every hardcoded hex
2. Fix all hardcoded hex colors: replace with CSS variable equivalents
3. Verify `app/globals.css` has complete `:root` and `.dark` token sets
4. Run `npm run build` — confirm 0 TypeScript errors

**Phase 2: Page-by-Page Audit (following AC-5 order)**
Visit each page in order. Document failures. Fix in priority order:
- Broken functionality (buttons that don't work, broken links) — highest priority
- Visual drift (wrong colors, fonts, shapes) — medium priority
- Missing micro-interactions — lower priority

**Phase 3: Accessibility Sweep**
Run axe-cli on all 3 key pages. Fix critical violations first.

**Phase 4: Mobile Sweep**
Test at 375px. Fix overflow and touch target issues.

**Phase 5: Final Build Verification**
`npm run build && npm run test` — must both pass with 0 failures.

### Hardcoded Hex Audit — Exact Replace Map

If you find hardcoded hex values, replace with the correct CSS variable:

| Hardcoded Value | Replace With | Context |
|---|---|---|
| `#2d4a3e` | `var(--primary)` or `bg-primary` | Forest green CTAs, sidebar |
| `#f5f3ee` | `var(--background)` or `bg-background` | Page background |
| `#e8ebe6` | `var(--secondary)` or `bg-secondary` | Hover surfaces |
| `#a8c4b2` | `var(--accent)` or `bg-accent` | Accent highlights |
| `#ffc00d` | `var(--warning)` or `bg-warning` | Conflict/warning badges |
| `#1a1a1a` | `var(--foreground)` or `text-foreground` | Dark text |
| `#ffffff` | `var(--card)` or `bg-card` | Card backgrounds |
| `#333333` | (in dark mode contexts) `var(--border)` | Dark borders |
| `#6b7280` | `var(--muted-foreground)` | Muted text |

### Typography Verification

Check every page's heading hierarchy:
```
grep -rn "text-4xl\|text-5xl\|text-3xl" app/ components/ --include="*.tsx" | grep -v "font-serif"
```
Any H1/H2 without `font-serif` must be fixed.

Check mono labels:
```
grep -rn "◆ " app/ components/ --include="*.tsx" | grep -v "font-mono"
```
Any ◆ mono label without `font-mono` must be fixed.

### Missing loading.tsx Audit

Check all dashboard routes:
```
find app/\(dashboard\) -name "page.tsx" | while read p; do
  dir=$(dirname "$p")
  if [ ! -f "$dir/loading.tsx" ]; then
    echo "MISSING: $dir/loading.tsx"
  fi
done
```

### Route Accessibility Audit

Every page must have:
1. Skip link as first focusable element
2. `<main id="main-content">` wrapper
3. `<header>` with `<nav>` for navigation
4. Semantic heading hierarchy (no skipped levels)

---

## Definition of Done

- [ ] `npm run build`: 0 TypeScript errors, 0 warnings
- [ ] `npm run test`: 0 test failures
- [ ] All AC-1 (brand color) items checked — 0 hardcoded hex violations
- [ ] All AC-2 (typography) items checked — 0 font-family violations
- [ ] All AC-3 (shape) items checked — 0 border-radius violations
- [ ] All AC-4 (micro-interactions) verified in browser — 0 missing
- [ ] All AC-5 (page-by-page) items checked — 0 functional defects
- [ ] All AC-6 (accessibility) items checked — 0 critical axe violations
- [ ] All AC-7 (performance) items checked
- [ ] All AC-8 (mobile) items checked
- [ ] Product walked through by a real person from /register → onboarding → chat → graph → workstation → sources → inbox
- [ ] Zero pages return 404 when navigated to from within the app
- [ ] No unhandled JavaScript errors in browser console on any page

---

## Final Localhost Verification (mandatory before marking complete)

After `npm run build` and `npm run test` both pass, verify the running application:

**Step 1 — Clear stale cache:**
```bash
rm -rf .next
```

**Step 2 — Start dev server:**
```bash
npm run dev
```

**Step 3 — Full page audit (visit in order):**
- [ ] http://localhost:3000/register → Clerk renders, cream background
- [ ] http://localhost:3000/login → Clerk renders, cream background
- [ ] http://localhost:3000/onboarding → Step indicator, role cards hover, confetti
- [ ] http://localhost:3000/chat → Empty state chips, message rendering
- [ ] http://localhost:3000/graph → Cytoscape renders, node panel opens
- [ ] http://localhost:3000/workstation → Streaming output, auto-save indicator
- [ ] http://localhost:3000/sources → Dropzone functional
- [ ] http://localhost:3000/inbox → Conflict cards, keyboard nav
- [ ] http://localhost:3000/settings → Toggles, profile CRUD
- [ ] http://localhost:3000/settings/billing → Tier display
- [ ] http://localhost:3000/settings/referrals → Copy button
- [ ] http://localhost:3000/settings/data → Export + delete
- [ ] http://localhost:3000/ → All sections, pricing anchor, footer links
- [ ] http://localhost:3000/privacy → Header + Footer + content
- [ ] http://localhost:3000/terms → Header + Footer + content

**Step 4 — Browser DevTools Console (on each page):**
Confirm no red errors on any page. Yellow warnings acceptable.

**Step 5 — Mobile test (DevTools → Toggle Device Toolbar → iPhone 12):**
- [ ] Sidebar becomes Sheet drawer
- [ ] No horizontal overflow
- [ ] All touch targets ≥ 44px

**Step 6 — Report one of:**
- ✅ `localhost verified` — all pages render correctly
- ⚠️ `Issue found: [page + describe issue]` — fix before committing docs

Only commit the docs update after ALL pages pass localhost verification.

---

## Testing This Story

```bash
# Build check:
npm run build
npm run test

# Hardcoded hex audit (0 matches in component files):
grep -rn "#2d4a3e\|#f5f3ee\|#e8ebe6\|#ffc00d\|#a8c4b2" \
  components/ app/ --include="*.tsx" --include="*.ts" \
  | grep -v "\.css:" | grep -v "// " | grep -v "cssVariable"

# Typography audit (0 H1/H2 without font-serif):
grep -rn "text-4xl\|text-5xl\|text-3xl" app/ components/ \
  --include="*.tsx" | grep -v "font-serif"

# Missing loading.tsx audit (0 missing):
find app/\(dashboard\) -name "page.tsx" | while read p; do
  dir=$(dirname "$p")
  [ -f "$dir/loading.tsx" ] || echo "MISSING: $dir/loading.tsx"
done

# Accessibility check (0 critical):
npx axe-cli http://localhost:3000 --tags wcag2a,wcag2aa
npx axe-cli http://localhost:3000/onboarding --tags wcag2a,wcag2aa
npx axe-cli http://localhost:3000/graph --tags wcag2a,wcag2aa

# Manual page walk-through (document results):
# /register → /onboarding → /chat → /graph → /workstation → /sources → /inbox
# /settings/billing → /settings/referrals → /settings/data → / → /privacy → /terms
```

---

## Frontend Agent Brief

> **Skill Invocations — invoke each skill before the corresponding phase:**
>
> **Phase 1 (Read/Design):** `Use /frontend-design — enforce production-grade aesthetic compliance`
> **Phase 2 (CSS/Tokens):** `Use /tailwindcss — for Tailwind CSS v4 token system`
> **Phase 3 (Layout):** `Use /tailwindcss-advanced-layouts — for multi-page layout audit`
> **Phase 4 (Accessibility):** `Use /tailwindcss-animations — for micro-interaction verification`
> **Phase 5 (Verification):** `Use /superpowers:verification-before-completion — before claiming done`

---

```
🎯 Target: Claude Code / MiniMax-M2.7 — Ultra-detailed planning and implementation
💡 Optimization: MiniMax-M2.7 directive — WRITE EVERYTHING IN MAXIMUM DETAIL.
   Plans MUST be 2000-4000 lines for this story. It is the most complex.
   Never short-circuit with "see existing files" or "grep to find". Actually run
   every command. Actually verify every item. Report exact grep output for each.

═══════════════════════════════════════════════════════════════════
NATURE OF THIS STORY
═══════════════════════════════════════════════════════════════════

This is a QUALITY AUDIT AND SURFACE CORRECTION PASS. No new features.
No business logic changes. No refactoring.

What you ARE doing:
- Verifying every page uses correct brand colors (CSS variables, no hardcoded hex)
- Verifying every page uses correct fonts (font-serif on headlines, font-mono on mono labels)
- Verifying every page uses correct shapes (rounded-2xl on cards, rounded-full on CTAs)
- Verifying every page has required micro-interactions
- Verifying every page has skip link + main landmark + correct heading hierarchy
- Fixing violations found during the audit

What you are NOT doing:
- NOT building new features
- NOT changing business logic
- NOT refactoring components for performance
- NOT adding new pages

═══════════════════════════════════════════════════════════════════
READING ORDER
═══════════════════════════════════════════════════════════════════

INVOKE: Use /frontend-design

Read ALL files in this order. Write "✅ CONFIRMED READ: [filename]" after each:

1. CLAUDE.md — all 19 rules. Study especially RULE 5, 10, 15, 16
2. docs/design/AGENT_DESIGN_PREAMBLE.md — entire file, every anti-pattern
3. docs/design/00-brand-identity.md — exact hex values, mono label pattern ◆
4. docs/design/01-design-system.md — all 18 CSS variables :root and .dark
5. docs/design/04-ux-patterns.md — micro-interaction specs, animation timings
6. docs/stories/epics.md — confirm all 37 previous stories listed
7. docs/stories/EPIC-08-polish/STORY-038.md (this file — all 8 AC categories)

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 1 — HARDCODE HEX AUDIT
═══════════════════════════════════════════════════════════════════

INVOKE: Use /tailwindcss

Run this command and record EVERY match:

grep -rn "#2d4a3e\|#f5f3ee\|#e8ebe6\|#ffc00d\|#a8c4b2\|#1a1a1a" \
  components/ app/ --include="*.tsx" --include="*.ts"

For each match found, record:
- File path
- Line number
- The actual line content
- Whether it is in globals.css (OK) or in a component file (MUST FIX)

IF ANY matches found in component files → fix immediately using this map:
  #2d4a3e → bg-primary
  #f5f3ee → bg-background
  #e8ebe6 → bg-secondary
  #a8c4b2 → bg-accent
  #ffc00d → bg-warning
  #1a1a1a → text-foreground

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 2 — CSS VARIABLES VERIFICATION
═══════════════════════════════════════════════════════════════════

Open app/globals.css. READ IT COMPLETELY.

Confirm ALL of these exist in :root:
--background: #f5f3ee
--foreground: #1a1a1a
--primary: #2d4a3e
--primary-foreground: #ffffff
--secondary: #e8ebe6
--muted-foreground: #6b7280
--accent: #a8c4b2
--warning: #ffc00d
--warning-foreground: #78350f
--border: #d1d5db
--card: #ffffff
--card-foreground: #1a1a1a
--radius: 1rem

Confirm ALL of these exist in .dark:
--background: #1a1a1a
--foreground: #f5f3ee
--primary: #3d6454
--primary-foreground: #f0f7f4
--secondary: #2a2a2a
--muted-foreground: #9ca3af
--border: #333333
--card: #242424

IF ANY MISSING OR WRONG → fix globals.css FIRST.

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 3 — BRAND COLOR AUDIT (AC-1)
═══════════════════════════════════════════════════════════════════

For each of these items, run the verification command and record PASS or FAIL:

AC-1a: Sidebar uses bg-primary in both modes
Command: grep -rn "bg-primary" app/\(dashboard\)/layout.tsx components/domain/Sidebar.tsx 2>/dev/null | head -5
Expected: className contains "bg-primary"
FAIL → add className="bg-primary" to sidebar nav container

AC-1b: Page background uses bg-background
Command: grep -rn "bg-background" app/\(dashboard\)/ | head -10
Expected: pages use bg-background not bg-white

AC-1c: CTA buttons use rounded-full
Command: grep -rn "bg-primary rounded-full" components/ app/ --include="*.tsx" | head -10
Expected: all primary CTAs have rounded-full

AC-1d: Cards use rounded-2xl
Command: grep -rn "bg-card rounded-2xl" components/ app/ --include="*.tsx" | head -10
Expected: all cards have rounded-2xl

AC-1e: Active nav items use bg-primary-foreground/15
Command: grep -rn "bg-primary-foreground/15" components/ --include="*.tsx" | head -5
Expected: active nav items have this class

AC-1f: Progress bars use bg-primary fill
Command: grep -rn "\[&>div\]:bg-primary\|bg-primary.*rounded-full.*h-" components/ --include="*.tsx" | head -5
Expected: progress bar fills use bg-primary

AC-1g: Focus rings use ring-primary/30
Command: grep -rn "focus:ring-primary\|ring-primary/30" components/ --include="*.tsx" | head -5
Expected: focus states use forest green ring

AC-1h: Conflict badges use bg-warning text-[var(--warning-foreground)]
Command: grep -rn "bg-warning" components/domain/ --include="*.tsx" | head -5
Expected: conflict/warning badges use bg-warning

AC-1i: Zero hardcoded hex in components (already verified in Phase 1)

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 4 — TYPOGRAPHY AUDIT (AC-2)
═══════════════════════════════════════════════════════════════════

AC-2a: All H1 use font-serif
Command: grep -rn "text-[0-9]xl" app/\(marketing\)/ --include="*.tsx" | grep -v font-serif | head -10
Expected: 0 matches (all headlines use font-serif)

AC-2b: All H2 use font-serif
Command: grep -rn "font-serif text-2xl\|font-serif text-3xl" components/ app/ --include="*.tsx" | wc -l
Expected: many matches (all section headings)

AC-2c: All body text uses font-sans (default, no class needed)
Command: grep -rn "className=.*font-sans" components/ app/ --include="*.tsx" | head -5
Expected: only when explicitly needed

AC-2d: All mono labels use font-mono
Command: grep -rn "◆ " components/ app/ --include="*.tsx" | grep -v font-mono | head -10
Expected: 0 matches (all ◆ labels are font-mono)

AC-2e: Status chips use font-mono
Command: grep -rn "rounded-full.*font-mono\|font-mono.*rounded-full" components/ --include="*.tsx" | head -5
Expected: status chips have font-mono

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 5 — SHAPE AUDIT (AC-3)
═══════════════════════════════════════════════════════════════════

AC-3a: All cards rounded-2xl (not rounded-lg)
Command: grep -rn "bg-card rounded-lg\|bg-card rounded-xl" components/ app/ --include="*.tsx"
Expected: 0 matches — all cards must be rounded-2xl

AC-3b: All primary CTAs rounded-full (not rounded-md)
Command: grep -rn "bg-primary rounded-md\|bg-primary rounded-lg" components/ app/ --include="*.tsx"
Expected: 0 matches — all primary CTAs must be rounded-full

AC-3c: All dialog content rounded-2xl
Command: grep -rn "DialogContent\|AlertDialogContent" components/ --include="*.tsx" | head -5
Expected: shadcn Dialog content is rounded-2xl by default

AC-3d: All inputs rounded-xl
Command: grep -rn "rounded-lg.*border\|border.*rounded-lg" components/ --include="*.tsx" | head -5
Expected: input fields should be rounded-xl

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 6 — MICRO-INTERACTIONS AUDIT (AC-4)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /tailwindcss-animations

AC-4a: Primary buttons: hover:-translate-y-px active:translate-y-0
Check: grep -rn "hover:-translate-y-px" components/ --include="*.tsx" | head -5

AC-4b: Secondary buttons: hover:bg-secondary
Check: grep -rn "hover:bg-secondary" components/ --include="*.tsx" | head -5

AC-4c: Cards: hover:shadow-md transition-shadow
Check: grep -rn "hover:shadow-md" components/ --include="*.tsx" | head -5

AC-4d: Nav links: underline grow animation (NOT bg-primary hover)
Check: grep -rn "hover:bg-primary" components/marketing/Header.tsx | head -5
Expected: nav links should NOT use bg-primary hover — use underline animation

AC-4e: Inputs: focus:ring-2 focus:ring-primary/30 focus:border-primary
Check: grep -rn "focus:ring-2 focus:ring-primary/30" components/ --include="*.tsx" | head -5

AC-4f: Dropdown menus: animate-in fade-in zoom-in-95
Check: grep -rn "animate-in fade-in" components/ --include="*.tsx" | head -5

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 7 — PAGE-BY-PAGE AUDIT (AC-5)
═══════════════════════════════════════════════════════════════════

For EACH page below, verify:
1. Page renders without crash
2. Brand colors correct (no white backgrounds, no wrong greens)
3. Typography correct (font-serif headlines, font-mono labels)
4. Shapes correct (rounded-2xl cards, rounded-full CTAs)
5. Required elements present (skip link, main landmark, correct heading hierarchy)

Run: npm run build && npm run dev
Then manually visit each page and record PASS or FAIL with notes.

Pages to audit (in order):
1. http://localhost:3000/register
2. http://localhost:3000/login
3. http://localhost:3000/onboarding
4. http://localhost:3000/chat
5. http://localhost:3000/graph
6. http://localhost:3000/workstation
7. http://localhost:3000/sources
8. http://localhost:3000/inbox
9. http://localhost:3000/settings
10. http://localhost:3000/settings/billing
11. http://localhost:3000/settings/referrals
12. http://localhost:3000/settings/data
13. http://localhost:3000/
14. http://localhost:3000/privacy
15. http://localhost:3000/terms

For each page, record:
[PASS/FAIL] PageName
- Brand colors: OK / ISSUES (list)
- Typography: OK / ISSUES (list)
- Shapes: OK / ISSUES (list)
- Required elements: OK / MISSING (list)

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 8 — ACCESSIBILITY AUDIT (AC-6)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /superpowers:verification-before-completion

Run axe on 3 key pages:

npx axe-cli http://localhost:3000 --tags wcag2a,wcag2aa
npx axe-cli http://localhost:3000/onboarding --tags wcag2a,wcag2aa
npx axe-cli http://localhost:3000/graph --tags wcag2a,wcag2aa

Record number of critical violations for each. Must be 0.

Manual checks:
□ Every page has skip link as first focusable element
□ Every page has <main id="main-content">
□ No keyboard traps in any component
□ All images have alt text
□ aria-live regions on streaming content

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 9 — PERFORMANCE AUDIT (AC-7)
═══════════════════════════════════════════════════════════════════

npm run build
Expected: 0 TypeScript errors, 0 warnings

npm run test
Expected: 0 test failures

grep -rn "console.error\|console.warn" components/ app/ --include="*.tsx" --include="*.ts"
Expected: 0 matches (no console.error/warn in production code)

find app/\(dashboard\) -name "page.tsx" | while read p; do
  dir=$(dirname "$p")
  [ -f "$dir/loading.tsx" ] || echo "MISSING loading.tsx: $dir"
done
Expected: 0 missing loading.tsx files

═══════════════════════════════════════════════════════════════════
AUDIT PHASE 10 — MOBILE AUDIT (AC-8)
═══════════════════════════════════════════════════════════════════

INVOKE: Use /tailwindcss-mobile-first

In browser DevTools, set viewport to 375px (iPhone 12).

For each dashboard page, verify:
□ Sidebar renders as Sheet drawer (not visible nav)
□ No horizontal overflow
□ All touch targets ≥ 44px height
□ Pricing cards stack vertically

═══════════════════════════════════════════════════════════════════
FIX PRIORITY
═══════════════════════════════════════════════════════════════════

Fix violations in this order (most impactful first):

P0 (Critical — fix immediately):
- Any page that crashes or shows 500 error
- Missing skip links on any page
- Hardcoded hex colors in component files
- Sidebar not using bg-primary

P1 (High — fix before marking complete):
- Cards using rounded-lg instead of rounded-2xl
- CTAs using rounded-md instead of rounded-full
- H1 without font-serif
- ◆ mono labels without font-mono
- Missing loading.tsx files

P2 (Medium — fix if found):
- Missing micro-interactions (hover states)
- Focus ring missing or wrong color
- Accessibility violations reported by axe

═══════════════════════════════════════════════════════════════════
ANTI-PATTERNS — automatic rejection
═══════════════════════════════════════════════════════════════════

During this audit, if you find ANY of these, fix immediately and document:
❌ className with hardcoded hex color → replace with CSS variable
❌ className="rounded-lg" on any card → change to rounded-2xl
❌ className="rounded-md" on any CTA button → change to rounded-full
❌ className="bg-white" → change to bg-card or bg-background
❌ className without font-serif on h1 or h2 → add font-serif
❌ ◆ label without font-mono → add font-mono
❌ Page without loading.tsx → create it
❌ Marketing pages without Header or Footer → add them

═══════════════════════════════════════════════════════════════════
DOCUMENTATION — after fixing all violations
═══════════════════════════════════════════════════════════════════

Create a file: docs/stories/EPIC-08-polish/STORY-038-AUDIT.md

Audit results document with:
A. Hardcoded hex violations found and fixed (list each file:line:fix)
B. Typography violations found and fixed
C. Shape violations found and fixed
D. Micro-interaction violations found and fixed
E. Page-by-page results (PASS/FAIL for each of 15 pages)
F. Accessibility results (axe output per page)
G. Mobile results (issues found)
H. Performance results (npm run build + npm run test output)

═══════════════════════════════════════════════════════════════════
SUCCESS CRITERIA
═══════════════════════════════════════════════════════════════════

INVOKE: Use /superpowers:verification-before-completion

✅ npm run build: 0 TypeScript errors, 0 warnings
✅ npm run test: 0 failures
✅ AC-1: 0 hardcoded hex violations in component files
✅ AC-2: 0 typography violations (all headlines font-serif, all mono labels font-mono)
✅ AC-3: 0 shape violations (all cards rounded-2xl, all CTAs rounded-full)
✅ AC-4: All micro-interactions present
✅ AC-5: All 15 pages PASS page-by-page audit
✅ AC-6: axe reports 0 critical violations on 3 key pages
✅ AC-7: No console.error/warn in production code, all loading.tsx present
✅ AC-8: Mobile audit passes (no overflow, 44px touch targets)
✅ Product walked through /register → /onboarding → /chat → /graph → /workstation → /sources → /inbox without any page crashing or showing wrong colors

Show plan first. Do not implement yet.
```

---

## Development Loop

Follow the full loop defined in `docs/DEVELOPMENT_LOOP.md`.

**Quick reference for this story:**

```bash
# 1. Quality gate:
npm run build && npm run test   # frontend must pass

# 2. Commit (if any fixes needed):
git add -A && git commit -m "fix(ravenbase): STORY-038 UX polish audit fixes"
git push

# 3. Mark complete:
# Edit docs/stories/epics.md → STORY-038 🔲 → ✅
# Update docs/.bmad/story-counter.txt → FRONTEND_COMPLETE
# Update docs/.bmad/project-status.md → Phase B complete, all 38 stories done
# Append entry to docs/.bmad/journal.md
git add docs/stories/epics.md docs/.bmad/story-counter.txt \
       docs/.bmad/project-status.md docs/.bmad/journal.md
git commit -m "docs: mark STORY-038 complete, Phase B frontend fully done"
git push
```

---

## Docs Update (after completion)

After localhost verification passes, update all four docs files in one commit:

1. **docs/stories/epics.md** — STORY-038: 🔲 → ✅ in EPIC-08 table
2. **docs/.bmad/story-counter.txt** — change contents to: `FRONTEND_COMPLETE`
3. **docs/.bmad/project-status.md** — Phase: "B complete" | Sprint: "38" | Status: "38/38 stories complete"
4. **docs/.bmad/journal.md** — append Sprint 38 entry:
   ```
   ## Sprint 38 — Final UX Polish Pass
   Story: STORY-038
   Completed: [date from git log --oneline -1]
   Summary: End-to-end UX audit covering brand color system, typography, shape audit,
            micro-interactions, page-by-page functional check, accessibility (axe-cli),
            performance, and mobile. All 37 previous stories verified for visual compliance.
   Violations found: [N] hardcoded hex colors, [N] missing font-serif, [N] wrong border-radius
   All violations: fixed and committed
   ```
