# STORY-031: Dark Mode Toggle

**Epic:** EPIC-08 — Polish & Production Hardening
**Priority:** P1
**Complexity:** Small
**Depends on:** STORY-001-WEB (web repo scaffold must exist)

---

## Functional Requirements
<!-- Which FR acceptance criteria does this story satisfy? -->
None — dark mode toggle story.

## Component
UI/Polish

---

> **Before You Start This Story — Read These Files First:**
> 1. `CLAUDE.md` (frontend rules — especially RULE 9: no forced color mode in route groups)
> 2. `docs/design/01-design-system.md` — complete CSS token system, dark/light values
> 3. `docs/design/CLAUDE_FRONTEND.md` — RULE 9: no forced color mode in route groups
> 4. `docs/stories/EPIC-08-polish/STORY-031.md` (this file)

---

## User Story

As a user, I want to toggle between light and dark mode so I can use Ravenbase
comfortably in different lighting conditions.

## Context

- Color system: `docs/design/01-design-system.md` — both `:root` and `.dark` token sets
- Both themes are already defined in `globals.css`
- Default is LIGHT mode — dark is toggled by adding `.dark` to `<html>`
- Preference is persisted to localStorage
- No `next-themes` package — implement directly with localStorage + classList

## Acceptance Criteria

- [ ] AC-1: Dark mode toggle button appears in the dashboard header (top right, near avatar)
- [ ] AC-2: Toggle adds/removes `.dark` class on `document.documentElement`
- [ ] AC-3: User preference persisted to `localStorage` key `ravenbase-theme`
- [ ] AC-4: On page load, preference restored from localStorage before first paint (no flash)
- [ ] AC-5: Toggle shows Sun icon in dark mode (click to go light), Moon icon in light mode (click to go dark)
- [ ] AC-6: Marketing pages (landing, pricing) also respect the stored theme preference
- [ ] AC-7: Default is light mode if no preference is stored
- [ ] AC-8: Mobile: toggle button visible in mobile header (not hidden behind a menu);
  touch target is minimum 44px

## Technical Notes

### Files to Create
- `hooks/use-theme.ts` — theme state hook with localStorage persistence

### Files to Modify
- `app/layout.tsx` — add inline script in `<head>` for no-flash
- `app/(dashboard)/layout.tsx` — add `<ThemeToggle />` in header (REMOVE any forced `.dark` class)
- `app/(marketing)/layout.tsx` — REMOVE any forced `.light` class

### No-Flash Implementation

```tsx
// app/layout.tsx — inline script in <head> before any rendering
// Prevents flash of wrong theme on page load
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        const stored = localStorage.getItem('ravenbase-theme');
        if (stored === 'dark') {
          document.documentElement.classList.add('dark');
        }
      })();
    `,
  }}
/>
```

### Theme Hook

```typescript
// hooks/use-theme.ts
"use client";
import { useEffect, useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Read stored preference
    const stored = localStorage.getItem("ravenbase-theme");
    const prefersDark = stored === "dark";
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ravenbase-theme", next ? "dark" : "light");
  };

  return { isDark, toggle };
}
```

### Toggle Button Component

```tsx
// components/domain/ThemeToggle.tsx — using pattern from BrandStyleGuide
"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary
                 hover:bg-accent transition-colors text-xs font-mono
                 text-muted-foreground border border-border"
      aria-label="Toggle dark mode"
    >
      {isDark
        ? <Moon className="w-3.5 h-3.5 text-primary" />
        : <Sun className="w-3.5 h-3.5 text-primary" />
      }
      <span className="hidden sm:inline">{isDark ? "Night" : "Day"}</span>
    </button>
  );
}
```

### Architecture Constraints

- No `next-themes` package — implement directly with localStorage + classList
- No `"use client"` on layout files — `ThemeToggle` component handles its own client boundary
- The inline `<script>` in `<head>` is the only way to prevent flash; this is acceptable
- Dark mode toggle belongs in the dashboard header, NOT in settings (accessibility)
- Sidebar remains `bg-primary` (forest green) in both light and dark mode

## UX & Visual Quality Requirements (mandatory — agent must complete ALL of these)

### Brand Color Verification (do this FIRST before any dark mode work)
Before implementing the toggle, verify and fix the brand color system:

1. Open app/globals.css and confirm these exact CSS variable values exist
   in the :root block. If wrong or missing, fix them:

   --background: #f5f3ee;           /* warm cream */
   --foreground: #1a1a1a;
   --card: #ffffff;
   --card-foreground: #1a1a1a;
   --primary: #2d4a3e;              /* forest green */
   --primary-foreground: #ffffff;
   --secondary: #e8ebe6;
   --secondary-foreground: #1a1a1a;
   --muted: #e8ebe6;
   --muted-foreground: #6b7280;
   --accent: #a8c4b2;
   --accent-foreground: #1a1a1a;
   --warning: #ffc00d;
   --warning-foreground: #78350f;
   --success: #3d8b5a;
   --success-foreground: #ffffff;
   --destructive: #b53233;
   --destructive-foreground: #ffffff;
   --border: #d1d5db;
   --input: #d1d5db;
   --ring: #2d4a3e;
   --radius: 1rem;                  /* 16px = rounded-2xl */

   .dark {
     --background: #1a1a1a;
     --foreground: #f5f3ee;
     --card: #242424;
     --card-foreground: #f5f3ee;
     --primary: #3d6454;            /* lighter forest green for dark bg contrast */
     --primary-foreground: #f0f7f4;
     --secondary: #2a2a2a;
     --secondary-foreground: #e8ebe6;
     --muted: #2a2a2a;
     --muted-foreground: #9ca3af;
     --accent: #2d4a3e;
     --accent-foreground: #a8c4b2;
     --warning: #ffc93d;
     --warning-foreground: #1a1a1a;
     --success: #4caf6c;
     --success-foreground: #1a1a1a;
     --destructive: #ef4444;
     --destructive-foreground: #ffffff;
     --border: #333333;
     --input: #333333;
     --ring: #3d6454;
   }

2. Confirm the @theme inline block correctly maps to next/font CSS variables:
   @theme inline {
     --font-sans: var(--font-dm-sans), "DM Sans", sans-serif;
     --font-serif: var(--font-playfair-display), "Playfair Display", Georgia, serif;
     --font-mono: var(--font-jetbrains-mono), "JetBrains Mono", monospace;
   }

3. Confirm app/layout.tsx applies font variables to <html>:
   className={`${dmSans.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}

4. After confirming/fixing the above, verify visual output:
   npm run dev
   Visit http://localhost:3000
   - Background must be warm cream #f5f3ee (NOT white, NOT gray)
   - If still wrong: run rm -rf .next && npm run dev

### Dark Mode Toggle Implementation Requirements

5. No flash of wrong theme on page load. Add this blocking script
   to <head> in app/layout.tsx BEFORE any stylesheets:
   <script dangerouslySetInnerHTML={{ __html: `
     (function(){
       try {
         var s = localStorage.getItem('ravenbase-color-scheme');
         var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
         if (s === 'dark' || (!s && d)) {
           document.documentElement.classList.add('dark');
         }
       } catch(e) {}
     })();
   `}} />

6. Smooth color transition on toggle (no jarring flash):
   Add to globals.css:
   html.transitioning * {
     transition: background-color 200ms ease, border-color 200ms ease,
                 color 150ms ease !important;
   }
   When toggling, add 'transitioning' class to html, remove after 250ms.

7. Toggle button in DashboardHeader:
   - Sun icon (Lucide Sun) when dark mode is active, click → light
   - Moon icon (Lucide Moon) when light mode is active, click → dark
   - Icon rotates 180deg on toggle: className="transition-transform duration-300"
   - Button: className="p-2 rounded-lg hover:bg-secondary transition-colors min-h-[44px] min-w-[44px]"
   - Store preference in localStorage key: 'ravenbase-color-scheme'
   - Sync with system preference if no localStorage value

8. Dark mode sidebar: sidebar must remain bg-primary (forest green)
   in BOTH light and dark mode. Never use bg-background on sidebar.

9. Every existing CSS color in the codebase that is hardcoded (not using
   CSS variables) must be updated to use the design token. Search for:
   grep -r "#2d4a3e\|#f5f3ee\|#e8ebe6\|#ffc00d" components/ app/
   Replace all hardcoded hex values with the corresponding CSS variable.

## Definition of Done

- [ ] Toggle appears in dashboard header
- [ ] `.dark` class added/removed on `<html>` element
- [ ] Preference persisted to localStorage
- [ ] No flash of wrong theme on page load
- [ ] Marketing pages respect stored preference
- [ ] `npm run build` passes (0 TypeScript errors)

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
- Sign in if redirected to /login
- Navigate to any dashboard page (e.g., `/dashboard/inbox`)
- Confirm NO "Internal Server Error" or webpack runtime errors
- Confirm CSS loads correctly (no unstyled content)
- Open browser DevTools → Console tab
- Confirm no red errors (yellow warnings acceptable)

**Step 4 — Report one of:**
- ✅ `localhost verified` — page renders correctly
- ⚠️ `Issue found: [describe issue]` — fix before committing docs

Only commit the docs update (epics.md, story-counter, project-status, journal) AFTER localhost verification passes.

## Testing This Story

```bash
# Build check:
npm run build

# Manual test:
# 1. Load app — verify light mode (cream background #f5f3ee, green sidebar)
# 2. Click toggle — verify dark mode (dark background #1a1a1a, adjusted green sidebar)
# 3. Refresh — verify dark mode persists
# 4. Open new tab — verify same preference
# 5. Toggle back — verify light mode
# 6. DevTools → localStorage → verify 'ravenbase-theme' key set to 'dark' or 'light'
# 7. Navigate to landing page — verify theme persists across routes
```

**Passing result:** Toggle switches between cream-background light mode and dark #1a1a1a dark mode. Preference persists across refreshes and new tabs. No flash on load.

---

## Frontend Agent Brief

Read these files FIRST before writing any code:
1. CLAUDE.md (all 19 rules)
2. docs/design/AGENT_DESIGN_PREAMBLE.md (non-negotiable visual rules)
3. docs/design/00-brand-identity.md (brand colors, mono labels)
4. docs/design/01-design-system.md (all color tokens)

PLAN QUALITY: The plan must be minimum 800 lines. Write full
TypeScript for every component — no pseudocode.

```
Implement STORY-031: Dark Mode Toggle.

Key constraints:
- Implement with localStorage + classList, NOT next-themes package
- No-flash inline script in <head> (must run before React hydrates)
- Remove any forced .dark/.light class from route group layouts
- ThemeToggle component in dashboard header (not settings page)
- Default = light mode
- Sidebar must remain bg-primary (forest green) in both light and dark mode

Show plan first. Do not implement yet.
```

---

## Development Loop

Follow the full loop defined in `docs/DEVELOPMENT_LOOP.md`.

```bash
npm run build && npm run test
git add -A && git commit -m "feat(ravenbase): STORY-031 dark mode toggle"
git push
# Edit docs/stories/epics.md → 🔲 → ✅ for STORY-031
git add docs/stories/epics.md && git commit -m "docs: mark STORY-031 complete"
git push
```
