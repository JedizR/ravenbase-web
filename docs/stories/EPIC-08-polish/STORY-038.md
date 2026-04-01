# STORY-038 — Final UX Polish Pass

**Epic:** EPIC-08 — Polish & Production Hardening
**Priority:** P0 (must complete before launch)
**Complexity:** Large
**Sprint:** 38
**Depends on:** All stories STORY-031 through STORY-036 complete

---

## Goal

Perform a comprehensive end-to-end audit of the entire Ravenbase frontend.
Every page must feel polished, every interaction must have feedback, every
color must match the brand system. This is the final gate before the product
is shown to real users.

---

## Frontend Agent Brief

Read these files FIRST before writing any code:
1. CLAUDE.md (all 19 rules)
2. docs/design/AGENT_DESIGN_PREAMBLE.md (non-negotiable visual rules)
3. docs/design/00-brand-identity.md (brand colors, mono labels)
4. docs/design/01-design-system.md (all color tokens)
5. docs/design/02-component-library.md (component specs)
6. docs/design/04-ux-patterns.md (interaction patterns)

PLAN QUALITY: This plan must be minimum 1500 lines. Write the exact
Tailwind className or CSS for every fix — no vague descriptions.

---

## Acceptance Criteria

### AC-1: Brand Color Audit (0 defects)
- [ ] Sidebar: bg-primary (#2d4a3e) in BOTH light and dark mode
- [ ] Page background: bg-background (#f5f3ee light, #1a1a1a dark)
- [ ] All CTA buttons: bg-primary rounded-full
- [ ] All cards: bg-card rounded-2xl border border-border
- [ ] Active nav items: bg-primary-foreground/15 text-primary-foreground
- [ ] Progress bars: [&>div]:bg-primary
- [ ] Focus rings: ring-2 ring-primary/30
- [ ] Conflict/warning badges: bg-warning text-[var(--warning-foreground)]
- [ ] No hardcoded hex colors in any component file (use CSS variables only)

### AC-2: Typography Audit (0 defects)
- [ ] All page H1 headlines: font-serif (Playfair Display)
- [ ] All section H2 headlines: font-serif
- [ ] All body text: font-sans (DM Sans)
- [ ] All mono labels (◆ LABEL_NAME): font-mono (JetBrains Mono)
- [ ] All status chips and system identifiers: font-mono
- [ ] All code blocks: font-mono

### AC-3: Shape Audit (0 defects)
- [ ] All cards: rounded-2xl (never rounded-lg)
- [ ] All primary CTA buttons: rounded-full (never rounded-md)
- [ ] All dialog/modal content: rounded-2xl
- [ ] All input fields: rounded-xl

### AC-4: Micro-Interaction Audit
Each item below must be manually verified in the browser:
- [ ] Primary buttons: lift (translateY -1px) on hover, press down on click
- [ ] Secondary buttons: subtle background color shift on hover
- [ ] Cards: shadow increase on hover (hover:shadow-md)
- [ ] Nav links in marketing header: underline grows from left on hover
- [ ] Sidebar nav items: icon scale 1.1x on hover
- [ ] Inputs: forest green ring + border color on focus
- [ ] Dropdown menus: scale(0.95)→scale(1) + fade on open
- [ ] Sonner toasts: slide in from bottom-right
- [ ] Conflict cards: slide out to right on resolve
- [ ] Progress bars: width transition 300ms ease

### AC-5: Page-by-Page Functional Audit

**/login and /register:**
- [ ] Clerk SignIn/SignUp renders with brand lockup above
- [ ] Background is warm cream (not white)
- [ ] After register → redirects to /onboarding
- [ ] After login → redirects to /chat

**/onboarding:**
- [ ] Step indicator shows "Step X of 3" and time estimate
- [ ] Role cards have hover lift + checkmark when selected
- [ ] "Nice to meet you, [Name]!" appears after name entry
- [ ] Step 3 progress bar is forest green
- [ ] Confetti animates on completion
- [ ] Redirects to /chat?first_run=true after completion

**/chat:**
- [ ] Empty state shows example prompt chips
- [ ] User messages: right-aligned bg-secondary rounded-2xl
- [ ] Assistant messages: left-aligned bg-card border rounded-2xl
- [ ] Typing indicator (3 bouncing dots) shows while streaming
- [ ] Citations render as clickable mono cards below message
- [ ] Session list in sidebar updates after each conversation
- [ ] Input: Enter sends, Shift+Enter inserts newline

**/graph:**
- [ ] Cytoscape renders with forest green nodes
- [ ] Clicking a node opens GraphNodePanel Sheet from right
- [ ] Filter bar has bg-card rounded-2xl container
- [ ] NL query bar appears above filter bar
- [ ] Query results highlight nodes in amber
- [ ] Mobile: ConceptList renders instead of Cytoscape

**/workstation:**
- [ ] Prompt textarea expands on focus
- [ ] Generate button is rounded-full bg-primary
- [ ] Streaming output shows blinking ▌ cursor
- [ ] Auto-save indicator shows ◆ SAVED_JUST_NOW after generation
- [ ] Export MD and Export PDF buttons work
- [ ] History sidebar lists previous documents
- [ ] Mobile: history in Sheet drawer

**/sources:**
- [ ] Upload Files tab: IngestionDropzone works (not a placeholder)
- [ ] Dropzone shows dashed border that changes on drag-over
- [ ] Import from AI Chat tab: prompt loads, copy button works
- [ ] Import submit shows IngestionProgress SSE bar

**/inbox:**
- [ ] Conflict cards render with OLD/NEW rows
- [ ] J/K navigates between cards
- [ ] Enter accepts, Backspace rejects
- [ ] C opens ConflictChat
- [ ] ? shows ShortcutOverlay
- [ ] Cards animate in on load, slide out on resolve
- [ ] Empty state shows animated checkmark

**/settings:**
- [ ] AI model cards: selected state has border-2 border-primary
- [ ] Notification toggles: forest green when on
- [ ] Profile CRUD: create/edit/delete all work

**/settings/billing:**
- [ ] Shows current tier (not just "free")
- [ ] Pro/Team: Manage subscription button opens Stripe portal
- [ ] Free: Upgrade to Pro button links to /#pricing

**/settings/referrals:**
- [ ] Referral link displays correctly
- [ ] Copy button shows 2s "Copied" state
- [ ] Stats card shows referral count

**/settings/data:**
- [ ] Format selector shows 3 options
- [ ] Export button triggers download
- [ ] Delete account opens AlertDialog with confirmation input

**/ (landing page):**
- [ ] All 9 sections render
- [ ] Pricing section accessible via /#pricing anchor
- [ ] Scroll animations play on features section
- [ ] Header nav links scroll to correct sections
- [ ] CTA buttons link to /register (not /dashboard)
- [ ] Footer Privacy + Terms links work (not 404)

**/privacy and /terms:**
- [ ] Both pages render with Header + Footer
- [ ] No 404 errors

### AC-6: Accessibility Audit (0 critical violations)
- [ ] Every page has a skip-to-content link as first focusable element
- [ ] All images have alt text
- [ ] All interactive elements reachable via Tab key
- [ ] No keyboard traps
- [ ] aria-live regions on all streaming content
- [ ] Run: npx axe-cli http://localhost:3000 (0 critical violations)
- [ ] Run: npx axe-cli http://localhost:3000/onboarding (0 critical)
- [ ] Run: npx axe-cli http://localhost:3000/graph (0 critical)

### AC-7: Performance Audit
- [ ] npm run build passes: 0 TypeScript errors, 0 warnings
- [ ] npm run test passes: 0 test failures
- [ ] No console.error or console.warn in production code
- [ ] All heavy imports use dynamic import (cytoscape, react-markdown)
- [ ] All dashboard routes have loading.tsx sibling files

### AC-8: Mobile Audit (test at 375px viewport)
- [ ] All touch targets ≥ 44px height
- [ ] No horizontal overflow on any page
- [ ] Sidebar renders as Sheet drawer
- [ ] Mobile menu opens and closes correctly
- [ ] Input keyboards don't cause layout shift
- [ ] Pricing cards stack vertically

---

## Development Sequence

1. Run full audit: visit every page listed in AC-5 and document each failing item
2. Fix brand colors and typography system-wide first
3. Fix per-page functional issues (broken features before visual polish)
4. Apply micro-interactions from globals.css
5. Run accessibility check
6. Run performance check
7. Final build verification

---

## Definition of Done

- npm run build: 0 TypeScript errors
- npm run test: 0 test failures
- All AC-1 through AC-8 items checked
- Product has been walked through by a real person from /register
  through onboarding → chat → graph → workstation → sources → inbox
- Zero pages return 404 when navigated to from within the app
- No unhandled JavaScript errors in browser console on any page

---

## Docs Update (after completion)

- docs/stories/epics.md → STORY-038 🔲 → ✅
- docs/.bmad/story-counter.txt → FRONTEND_COMPLETE
- docs/.bmad/project-status.md → Phase B complete, all 38 stories done
- docs/.bmad/journal.md → ## Sprint 38 — Final UX Polish Pass
- Commit all four docs files together
