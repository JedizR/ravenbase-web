# STORY-042 — Production Readiness: Bug Fixes, Design Polish & Deployment Hardening

> **Story ID:** STORY-042
> **Epic:** EPIC-10 — Production Launch
> **Type:** Bug Fix + UX Polish + Security + DevOps
> **Priority:** P0 — critical for production launch
> **Sprint:** 42
> **DEPENDS ON:** STORY-039, STORY-040, STORY-041 (all complete)
> **Estimated complexity:** XL (5 parts, 42 items)

---

## Summary

Deep audit of the deployed codebase at https://www.ravenbase.cc revealed **42 production-blocking issues** across 5 categories. The current live site loads and the design system colors are correct, but the actual user journey is broken: streaming chat crashes on errors, the graph page shows a blank screen when Neo4j is degraded, the workstation never auto-saves, file uploads silently drop files, and security tokens are exposed in URLs.

This story transforms Ravenbase from "deploys and loads" to "production-grade SaaS users can rely on."

---

## PART A — Critical Bug Fixes (15 items)

These bugs make core features unusable. Each item includes the file, line reference, the bug, and the exact fix.

### A-001: SSE hook exposes JWT in URL query parameter (SECURITY)
- **File:** `hooks/use-sse.ts:39`
- **Bug:** `const fullUrl = ...?token=${encodeURIComponent(token)}` puts the JWT in the browser URL bar, server logs, and Referrer headers.
- **Fix:** For EventSource (GET-only), this is a known limitation. Add a short-lived token exchange: call `/v1/auth/sse-token` to get a 60-second ephemeral token, use THAT in the query param instead of the full JWT. If backend change is out of scope, document the risk and ensure the API endpoint rotates tokens.
- **Workaround (immediate):** Add `Referrer-Policy: no-referrer` to SSE requests and ensure server logs redact query params.

### A-002: SSE stream hook has NO authentication
- **File:** `hooks/use-sse-stream.ts:34`
- **Bug:** `new EventSource(url)` is called with zero auth headers or tokens. If the streaming endpoint requires auth, requests fail silently.
- **Fix:** Mirror the token-in-query-param pattern from `use-sse.ts` (with the same ephemeral token approach). The caller must pass a token.

### A-003: SSE hooks have no retry on transient errors
- **Files:** `hooks/use-sse.ts:75-78`, `hooks/use-sse-stream.ts:61-64`
- **Bug:** On network error, EventSource closes permanently. Temporary Wi-Fi dropout = permanent failure until page refresh.
- **Fix:** Add retry with exponential backoff: 3 attempts at 1s, 2s, 4s delays. After 3 failures, set `status: "error"` with a "Retry" callback in state.

### A-004: SSE hooks have no inactivity timeout
- **Files:** `hooks/use-sse.ts`, `hooks/use-sse-stream.ts`
- **Bug:** If server stops sending data mid-stream (crash, OOM), the connection stays open forever. User sees infinite loading spinner.
- **Fix:** Add a 30-second inactivity timer that resets on each received message. If timer fires, close the connection and set `status: "error"`.

### A-005: MemoryChat JSON.parse crash on malformed SSE
- **File:** `components/domain/MemoryChat.tsx:~182`
- **Bug:** `JSON.parse(line.slice(5).trim())` has no try-catch. Corrupted SSE data (bad UTF-8, truncated JSON) crashes the entire chat component — user sees blank screen and loses all messages.
- **Fix:** Wrap in try-catch, skip malformed events, log to console.error in dev only.

### A-006: MemoryChat isStreaming stuck on error
- **File:** `components/domain/MemoryChat.tsx:~159-166`
- **Bug:** When API returns non-202 error, `isError: true` is set but `isStreaming` stays `true` on the assistant message. User sees a spinning loader on an error message forever.
- **Fix:** In the error handler, also set `isStreaming: false` on the last message.

### A-007: MemoryChat clears user input on 402 (credits) error
- **File:** `components/domain/MemoryChat.tsx:~116,155`
- **Bug:** Input is cleared before the API call. If user hits insufficient credits, their message is lost — no way to retry after upgrading.
- **Fix:** Only clear input after successful stream start (202 response). On 402 or other errors, keep the input text.

### A-008: MemoryChat discards citations from past sessions
- **File:** `components/domain/MemoryChat.tsx:~81-92`
- **Bug:** When loading past sessions, citations are hardcoded to `[]`. User sees old answers with no source references, breaking the "always cite" contract.
- **Fix:** Map citations from the `ChatSessionDetail` response into each message object.

### A-009: MetaDocEditor auto-save is fake
- **File:** `components/domain/MetaDocEditor.tsx`
- **Bug:** The save status indicator shows `◆ SAVED_JUST_NOW` / `◆ SAVED_2_MIN_AGO` / `◆ UNSAVED_CHANGES` but **never actually saves anything**. No localStorage writes, no auto-save timer. Content is lost on navigation or refresh.
- **Fix:** Implement real auto-save: `useEffect` with 30-second interval that writes `{ docId, content, timestamp }` to `localStorage.setItem('ravenbase-draft-${docId}')`. On mount, check for draft and offer recovery. Clear draft on successful API save.

### A-010: MetaDocEditor streaming cursor stays after completion
- **File:** `components/domain/MetaDocEditor.tsx:~275`
- **Bug:** `{content + streamingCursor}` renders the `▌` cursor character even after streaming ends. User sees a stray cursor in their finished document.
- **Fix:** Conditionally render: `{content}{isStreaming && streamingCursor}`

### A-011: GraphExplorer shows blank screen when Neo4j is down
- **File:** `components/domain/GraphExplorer.tsx`, `app/(dashboard)/graph/GraphPageClient.tsx`
- **Bug:** When the API returns an error for graph data (Neo4j is currently DOWN in production), the GraphExplorer receives empty arrays and renders nothing. No error message, no retry button, no explanation.
- **Fix:** In GraphPageClient, check for `error` from useQuery and render an error card: "Knowledge graph is temporarily unavailable. Your data is safe — we're working on reconnecting." with a Retry button.

### A-012: Graph date range filter doesn't work
- **File:** `app/(dashboard)/graph/GraphPageClient.tsx:~38-41,52-55`
- **Bug:** The date range filter UI collects `dateRange.from` and `dateRange.to` state, but these values are **never added to the API query params**. The filter exists visually but has zero effect.
- **Fix:** Add date range to query params: `if (dateRange.from) params.set("from", dateRange.from.toISOString())` and same for `to`.

### A-013: IngestionDropzone accepts 10 files but only processes the first
- **File:** `components/domain/IngestionDropzone.tsx:~28-29,41`
- **Bug:** `maxFiles: 10` in dropzone config, but `onFileAccepted(accepted[0])` only takes the first file. User drops 5 files, 4 are silently ignored.
- **Fix:** Set `maxFiles: 1` and update the UI text to say "Drop a file to ingest" (singular). Multi-file upload is a future feature.

### A-014: IngestionProgress starts SSE before token is ready
- **File:** `components/domain/IngestionProgress.tsx:~14-25`
- **Bug:** Token is fetched async in useEffect, but `useSSE(url, token)` is called on first render with `token = null`. First render fires SSE with no auth.
- **Fix:** Add `enabled` guard: only call useSSE when token is not null. Or pass token as dependency to delay SSE start.

### A-015: MemoryInbox activeIndex off-by-one after resolve
- **File:** `components/domain/MemoryInbox.tsx:~150,160`
- **Bug:** After resolving a conflict, `Math.min(i, conflicts.length - 2)` should be `conflicts.length - 1`. The `-2` causes the active card to jump back one position unnecessarily.
- **Fix:** Change to `Math.min(i, Math.max(0, updatedConflicts.length - 1))`.

---

## PART B — User Journey Fixes (12 items)

These issues don't crash the app but create confusing, frustrating, or broken user flows.

### B-001: ProfileContext doesn't persist active profile
- **File:** `contexts/ProfileContext.tsx:~97-99`
- **Bug:** Active profile resets to default on every page refresh. User switches to "Research" profile, refreshes, and they're back to "Personal".
- **Fix:** Persist `activeProfile.id` to `localStorage.setItem('ravenbase-active-profile', id)`. On mount, read from localStorage and set as initial active profile before API call completes.

### B-002: Sidebar shows stale credits for 15 seconds
- **File:** `components/domain/Sidebar.tsx:~44-48`
- **Bug:** Credits query has 15s staleTime. After chat/metadoc/ingest operations that deduct credits, the sidebar shows the old balance for up to 15 seconds. User attempts operations thinking they have credits, hits 402.
- **Fix:** After any mutation that deducts credits, call `queryClient.invalidateQueries({ queryKey: ["credits"] })`. Reduce staleTime to 5s.

### B-003: Sidebar hides credits for admin users
- **File:** `components/domain/Sidebar.tsx:~170-183`
- **Bug:** Admin users see "◆ ADMIN_ACCESS" badge but no credit balance at all. Admins need to see their balance too.
- **Fix:** Show both: admin badge AND credits balance below it.

### B-004: Sidebar shows no error when backend unreachable
- **File:** `components/domain/Sidebar.tsx:~36,44,50`
- **Bug:** If API is down, all three queries (conflicts, credits, user) fail silently. Sidebar shows "—" for credits with no explanation.
- **Fix:** Add a subtle error indicator: "Backend unreachable" text or a red dot next to the credit display when any query errors.

### B-005: Omnibar slash commands misleading
- **File:** `components/domain/Omnibar.tsx:~274-317`
- **Bug:** Only `/profile` and `/ingest <text>` actually work. But navigation commands (`/inbox`, `/graph`, `/sources`, `/settings`) work too. The problem is `/search` and `/generate` are mentioned in docs but NOT implemented — user types them and gets "No match."
- **Fix:** Remove any reference to `/search` and `/generate` from UI and help text until they're implemented. Add a "Type / for commands" hint showing ONLY working commands.

### B-006: OnboardingWizard has no retry on upload failure
- **File:** `components/domain/OnboardingWizard.tsx:~660-673`
- **Bug:** If file processing fails at step 3, the only button is "Go to workspace." User cannot retry the upload, must start fresh from the workspace.
- **Fix:** Add "Try again" button alongside "Go to workspace" that resets step 3 state and allows re-upload.

### B-007: CheckoutSuccessHandler redirects to wrong page
- **File:** `components/domain/CheckoutSuccessHandler.tsx:~15`
- **Bug:** After successful Stripe checkout, user is redirected to `/chat` — an empty chat with no confirmation that their upgrade worked.
- **Fix:** Redirect to `/settings/billing` so user sees their new subscription status. Also invalidate `["credits"]` and `["user"]` queries to refresh all data immediately.

### B-008: Mobile sidebar doesn't close after navigation
- **File:** `app/(dashboard)/layout.tsx`
- **Bug:** On mobile, after tapping a nav link in the sidebar sheet, the sidebar stays open, blocking the new page content.
- **Fix:** Listen to `pathname` changes via `usePathname()` and call `setMobileNavOpen(false)` when pathname changes.

### B-009: MemoryInbox swipe listener memory leak
- **File:** `components/domain/MemoryInbox.tsx:~256-266`
- **Bug:** Touch event listeners are added to `window` on each card render but never properly cleaned up. On rapid card swaps, listener count grows unbounded.
- **Fix:** Move touch handling to useEffect with cleanup return function.

### B-010: MemoryInbox chat submit accepts empty text
- **File:** `components/domain/MemoryInbox.tsx:~184-198`
- **Bug:** `handleChatSubmit(text)` sends any string to the API, including empty or whitespace-only strings.
- **Fix:** Add guard: `if (!text.trim()) return`.

### B-011: MemoryInbox buttons not disabled during mutation
- **File:** `components/domain/MemoryInbox.tsx:~237,272-273`
- **Bug:** Accept/Reject buttons remain clickable while mutation is in-flight. User can spam-click and create duplicate resolutions.
- **Fix:** Set `disabled={isPending}` on all action buttons.

### B-012: Graph filter state lost on navigation
- **File:** `app/(dashboard)/graph/GraphPageClient.tsx:~35-41`
- **Bug:** User applies node type filters and date range, navigates to another page, comes back — all filters reset to defaults.
- **Fix:** Persist filter state to URL search params via `useSearchParams()`, so filters survive navigation.

---

## PART C — Design & Visual Polish (10 items)

The current design follows the brand guidelines (correct colors, fonts, radii) but lacks the **premium feel** of a production SaaS. These items add visual depth, micro-interactions, and polish.

### C-001: Marketing page micro-interactions missing
- **Files:** `components/marketing/HeroSection.tsx`, `FeaturesSection.tsx`, `PricingSection.tsx`
- **Issue:** Feature cards have zero hover state. CTA buttons have no active/pressed feedback. Links have no underline animation. The page feels static and "dull."
- **Fix:**
  - Feature cards: `hover:shadow-lg hover:-translate-y-1 transition-all duration-300`
  - CTA buttons: `hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150`
  - Secondary links: `hover:underline underline-offset-4 decoration-primary/50`
  - All animations: wrap in `@media (prefers-reduced-motion: no-preference)` check

### C-002: Hero section lacks visual depth
- **File:** `components/marketing/HeroSection.tsx`
- **Issue:** Hero is flat text + animated graph on cream background. No texture, no visual layering, no atmosphere. Looks like a template.
- **Fix:**
  - Add subtle CSS noise/grain overlay on the hero section (`background-image: url("data:image/svg+xml,...")` technique)
  - Add a soft radial gradient behind the animated graph: `bg-gradient-radial from-accent/10 via-transparent to-transparent`
  - Add `text-wrap: balance` on the hero headline for better line breaks
  - Improve CTA hierarchy: primary = solid green pill, secondary = outline with arrow icon

### C-003: TestimonialsSection is empty (returns null)
- **File:** `components/marketing/TestimonialsSection.tsx`
- **Issue:** The component exists but renders nothing. Social proof is critical for SaaS conversion.
- **Fix:** Implement 3 testimonial cards using the brand mono-label pattern. Use fictional but realistic personas:
  - A researcher: "247 research papers, 3 years of notes — all queryable in seconds"
  - A product manager: "Found a contradiction between Q2 and Q4 strategy docs I'd missed for months"
  - A student: "My thesis bibliography built itself from 4 years of reading notes"
  - Style: `bg-card rounded-2xl p-6 border border-border` with `font-mono text-xs` reference IDs

### C-004: "How It Works" section missing
- **File:** `components/marketing/HeroSection.tsx:~58` links to `#how-it-works`
- **Issue:** Hero has a "Watch demo" link pointing to `#how-it-works` but no such section exists on the page. Dead link.
- **Fix:** Create a `WorkflowSection.tsx` component showing the 3-step process:
  1. Upload (drop files, paste text, import AI chats)
  2. Extract (knowledge graph builds automatically, conflicts detected)
  3. Query (ask questions, generate documents, export knowledge)
  - Use numbered steps with the `◆` mono-label pattern
  - Add the section to the marketing page with `id="how-it-works"`

### C-005: Feature cards lack interactivity and depth
- **File:** `components/marketing/FeaturesSection.tsx`
- **Issue:** Cards are static boxes with icon + title + description. No hover, no click, no visual hierarchy. Generic "three equal cards" layout.
- **Fix:**
  - Add hover state with shadow elevation and subtle border color change
  - Consider asymmetric layout: one large feature card (Memory Chat) + two smaller (Graph, Inbox)
  - Add subtle icon animation on hover (rotate, scale, or color shift)
  - Use accent color backgrounds on feature cards: `bg-accent/5 hover:bg-accent/10`

### C-006: Dashboard empty states are text-only
- **Files:** Various domain components
- **Issue:** Empty states in Chat, Graph, Inbox, Sources are just text like "Upload your first file." No illustration, no visual hierarchy, no clear CTA.
- **Fix:** For each empty state:
  - Add a relevant SVG illustration (abstract, brand-aligned — not cartoon)
  - Structure as: illustration + headline + description + primary CTA button
  - Use the `font-serif` headline + `font-sans` description pattern
  - Ensure the CTA is a `rounded-full bg-primary` button

### C-007: Footer fake status indicator
- **File:** `components/marketing/Footer.tsx:~51`
- **Issue:** `◆ ALL_SYSTEMS_OPERATIONAL` is hardcoded. Lies to users when the system is actually down (Neo4j IS down right now).
- **Fix:** Either:
  - Remove the status indicator entirely (honest approach), OR
  - Fetch `/health` from the API and show actual status (requires client component), OR
  - Replace with a static version indicator: `◆ MEMORY_LAYER_V1.0` (already exists, just remove the status part)

### C-008: Pricing table broken on mobile
- **File:** `components/marketing/PricingSection.tsx:~349`
- **Issue:** Comparison table uses `overflow-x-auto` — users must scroll horizontally to see all tiers. Easy to miss columns.
- **Fix:** On mobile (`md:hidden`), replace the table with a vertical card layout: one card per tier showing all features. On desktop, keep the table.

### C-009: Dashboard cards need subtle entry animations
- **Files:** Dashboard page components
- **Issue:** Pages load with all content appearing instantly. No visual flow or reading direction.
- **Fix:** Add staggered fade-in using CSS `animation-delay`:
  ```css
  .stagger-enter > * { animation: fade-in-up 0.3s ease-out both; }
  .stagger-enter > *:nth-child(1) { animation-delay: 0ms; }
  .stagger-enter > *:nth-child(2) { animation-delay: 50ms; }
  .stagger-enter > *:nth-child(3) { animation-delay: 100ms; }
  ```
  Add `@keyframes fade-in-up` to globals.css.

### C-010: Improve DashboardHeader for mobile
- **File:** `components/domain/DashboardHeader.tsx`
- **Issue:** Mobile hamburger has no aria-expanded state, no visual feedback. Omnibar crushes on small phones. Theme toggle has no aria-label.
- **Fix:**
  - Add `aria-expanded={isOpen}` to hamburger button
  - Add `aria-label="Toggle dark mode"` to theme toggle
  - Make Omnibar responsive: `max-w-[calc(100%-120px)]` on mobile to leave room for buttons

---

## PART D — Security & Stability (5 items)

### D-001: Hydration mismatch in useTheme
- **File:** `hooks/use-theme.ts:~9`
- **Bug:** Initial state hardcoded to `false`. On mount, reads localStorage which may be `true`. Causes flash of wrong theme.
- **Fix:** Initialize state from a function that checks `typeof window !== 'undefined'` and reads localStorage.

### D-002: Hydration mismatch in useMediaQuery
- **File:** `hooks/useMediaQuery.ts:~5`
- **Bug:** Same pattern — initial `false`, then updates on mount.
- **Fix:** Same approach — check window on initial render.

### D-003: DashboardHeader theme toggle needs aria-label
- Already covered in C-010.

### D-004: MemoryChat keyboard handler not memoized
- **File:** `components/domain/MemoryChat.tsx:~243-250`
- **Bug:** `handleKeyDown` recreated on every render, could cause rapid double-sends.
- **Fix:** Wrap in `useCallback` with proper dependencies.

### D-005: Footer version string hardcoded
- **File:** `components/marketing/Footer.tsx:~53`
- **Fix:** Import version from package.json or use a build-time constant.

---

## PART E — Deployment Verification (expanded from original)

### Prerequisites (user must complete)
- [x] Vercel account connected — ravenbase.cc deployed
- [x] Railway account — API running at ravenbase-api-production.up.railway.app
- [x] Clerk PRODUCTION application — live keys configured
- [ ] Neo4j AuraDB — currently DOWN, needs investigation/reconnection
- [x] Qdrant Cloud — working (health check "ok")
- [x] PostgreSQL — working (health check "ok")
- [x] Redis — working (health check "ok")

### Post-Fix Smoke Tests

**Health:**
- [ ] `https://ravenbase-api-production.up.railway.app/health` → all services "ok"
- [ ] `https://www.ravenbase.cc` → 200 OK, design system renders correctly

**Auth flow:**
- [ ] Registration → `/onboarding` → complete → `/chat` (not 404)
- [ ] `/dashboard` → 307 redirect to `/chat`
- [ ] Unauthenticated at `/chat` → redirect to `/login`

**Chat (after Neo4j fix):**
- [ ] Send message → streaming response appears progressively
- [ ] Network disconnect → error message shown (not infinite spinner)
- [ ] 402 insufficient credits → dialog shown, input preserved

**Graph:**
- [ ] When Neo4j down → error card with retry button (not blank screen)
- [ ] When working → nodes render, filters work, date range filters apply

**Workstation:**
- [ ] Generate meta-doc → streaming cursor visible during generation, disappears after
- [ ] Navigate away → auto-save to localStorage
- [ ] Return → draft recovery offered

**Sources:**
- [ ] Drop single file → upload starts, progress shown
- [ ] Drop multiple files → only 1 accepted (UI explains)

**Inbox:**
- [ ] Keyboard J/K → navigate conflicts
- [ ] Enter → resolve without off-by-one jump
- [ ] Empty submit → rejected

**Settings:**
- [ ] Active profile persists across page refresh
- [ ] Credits balance updates within 5 seconds of mutation
- [ ] Successful checkout → redirect to billing page

**Mobile:**
- [ ] Sidebar closes after navigation
- [ ] Touch targets ≥ 44px
- [ ] Safe-area-inset on sticky elements

**Security:**
- [ ] No JWT visible in browser URL bar
- [ ] `X-Frame-Options: DENY` header present
- [ ] `Strict-Transport-Security` header present

---

## Acceptance Criteria

All items in PART A (Critical) and PART B (User Journey) are REQUIRED.
PART C (Design) items C-001 through C-004 are REQUIRED; C-005 through C-010 are RECOMMENDED.
PART D (Security) items are REQUIRED.
PART E smoke tests must all pass.

**Quality gate:** `npm run build` → 0 TypeScript errors, 0 warnings.

---

## Cross-references

- `docs/components/REFACTOR_PLAN.md` — original bug documentation (STORY-039)
- `docs/design/AGENT_DESIGN_PREAMBLE.md` — brand rules for any UI changes
- `docs/design/01-design-system.md` — design tokens reference
- `docs/design/04-ux-patterns.md` — interaction patterns reference
- `CLAUDE.md` (frontend) — 19 rules, all must be followed
