# Omnibar

> **Component ID:** FE-COMP-04
> **Epic:** EPIC-02 — Ingestion Pipeline, EPIC-06 — Authentication & System Profiles
> **Stories:** STORY-008, STORY-020
> **Type:** Frontend (Dashboard)

---

## Goal

The Omnibar is the central command interface for Ravenbase. It provides slash commands for quick actions without navigating through menus. It is always accessible via a keyboard shortcut (Cmd+K or Ctrl+K) and appears as a floating input at the top of the dashboard. The two primary commands are `/ingest [text]` for quick text capture and `/profile` for switching between System Profiles.

---

## Product Requirements

1. **Omnibar Trigger:** Opens with `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux). Also clickable via a button in the dashboard header. Closes with `Escape`.

2. **Visual Appearance:** Floating modal/popover with search input at top, command list below. Appears centered at top of viewport. Warm cream background (`bg-card`), `rounded-2xl`, shadow-lg. Max height with scroll.

3. **`/ingest [text]` Command:** Typing `/ingest ` (with a space) followed by text captures it. Pressing Enter captures the text, shows a confirmation toast "Captured to [Profile Name]" within 2 seconds, and creates a `Source` record with `file_type="direct_input"` via `POST /v1/ingest/text`.

4. **Text Capture Limit:** 50,000 character limit. Over limit shows inline error "Text exceeds 50,000 characters" below the input.

5. **`/profile` Command:** Shows a dropdown of all user profiles with the active profile highlighted. Clicking a profile switches the active context. Keyboard: `↑/↓` to navigate, `Enter` to select.

6. **`/profile` Switch Behavior:** After switching, the Omnibar closes and the new profile is active for all subsequent API calls. The sidebar and page headers reflect the active profile name.

7. **Command List:** When input is empty, shows all available commands: `/ingest [text]`, `/profile`, and any future commands. Each command shows: name, keyboard shortcut, description.

8. **Real-time Parsing:** As user types, the Omnibar detects `↑` commands and shows the appropriate UI (text capture for `/ingest`, profile list for `/profile`).

9. **Toast Confirmation:** After text capture, uses `sonner` `toast()` to show: "Captured to [Profile Name]" with a checkmark icon. Auto-dismisses after 3 seconds.

10. **Active Profile Context:** The active System Profile is stored in React context and included in all data-fetching query keys for proper cache invalidation.

---

## Criteria and Tests

| Criterion | Test |
|---|---|
| Cmd+K opens Omnibar | Press Cmd+K → Omnibar modal appears |
| Escape closes Omnibar | Press Escape → Omnibar closes |
| `/ingest Hello world` + Enter → toast | Type `/ingest Hello world`, Enter → "Captured to [Profile]" toast |
| Text > 50,000 chars → error | Paste 50,001 chars → inline error shown |
| `/profile` shows profile list | Type `/profile` → dropdown of all profiles |
| Profile switch updates context | Switch profile → subsequent API calls use new profile_id |
| Omnibar closes after action | After capture or profile switch → closes automatically |
| Empty state shows command list | Open Omnibar with empty input → shows all commands |
| Keyboard navigation works | Type `/profile` → ↑/↓ to navigate, Enter to select |
| Mobile: tap to open | Mobile: header button opens Omnibar |
| Active profile highlighted in list | `/profile` → active profile shows checkmark |
| Omnibar is focus-trapped | Tab cycles through items within Omnibar |

---

## Related Stories

| Story | Title | Type | Description |
|---|---|---|---|
| [STORY-008](../stories/EPIC-02-ingestion/STORY-008.md) | Text Quick-Capture (Omnibar /ingest) | Frontend | `/ingest [text]` slash command |
| [STORY-020](../stories/EPIC-06-auth-profiles/STORY-020.md) | Profile Switching (Omnibar /profile) | Frontend | `/profile` command + active context |

---

## Component Files

```
components/domain/
  Omnibar.tsx           — Main Omnibar container with keyboard handler
  OmnibarInput.tsx      — Search input with slash command detection
  CommandList.tsx       — Command list when input is empty
  ProfileSwitchList.tsx — Profile list for /profile command
  IngestConfirm.tsx     — Inline preview before /ingest capture

hooks/
  use-omnibar.ts        — Cmd+K/Ctrl+K open/close, keyboard navigation

lib/
  omnibar-commands.ts   — Command definitions: /ingest, /profile
```

## Slash Command Detection

```tsx
// use-omnibar.ts
const COMMANDS = ["/ingest", "/profile"] as const

function detectCommand(input: string): { command: string | null; args: string } {
  const trimmed = input.trim()
  for (const cmd of COMMANDS) {
    if (trimmed.startsWith(`${cmd} `) || trimmed === cmd) {
      return {
        command: cmd,
        args: trimmed.slice(cmd.length).trim()
      }
    }
  }
  return { command: null, args: "" }
}

// In component:
const { command, args } = detectCommand(input)
if (command === "/ingest") {
  setView("ingest")
} else if (command === "/profile") {
  setView("profile")
} else {
  setView("commands")
}
```

## Omnibar Container Pattern

```tsx
// Omnibar.tsx
"use client"
import { useEffect, useRef, useState } from "react"
import { useHotkeys } from "~/hooks/use-hotkeys"  // or custom
import { CommandDialog, CommandInput, CommandList, CommandItem } from "~/components/ui/command"
import { toast } from "sonner"
import { useProfileContext } from "~/contexts/profile-context"

export function Omnibar() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const apiUpload = useApiUpload()
  const { profiles, activeProfile, switchProfile } = useProfileContext()

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleSubmit = async () => {
    const { command, args } = detectCommand(input)

    if (command === "/ingest") {
      if (args.length > 50_000) {
        setError("Text exceeds 50,000 characters")
        return
      }
      await apiUpload("/v1/ingest/text", {
        body: JSON.stringify({ content: args, profile_id: activeProfile?.id, tags: [] }),
      })
      toast.success(`Captured to ${activeProfile?.name ?? "Default"}`)
      setOpen(false)
      setInput("")
    }

    if (command === "/profile") {
      setView("profile")
    }
  }

  if (!open) return null

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={input}
        onValueChange={setInput}
        onKeyDown={e => {
          if (e.key === "Enter") handleSubmit()
          if (e.key === "Escape") setOpen(false)
        }}
        placeholder="Type /ingest or /profile..."
      />
      <CommandList>
        {input === "" && (
          <>
            <CommandItem onSelect={() => setInput("/ingest ")}>
              <span className="font-mono text-sm">/ingest [text]</span>
              <span className="text-xs text-muted-foreground ml-2">Quick text capture</span>
            </CommandItem>
            <CommandItem onSelect={() => setInput("/profile ")}>
              <span className="font-mono text-sm">/profile</span>
              <span className="text-xs text-muted-foreground ml-2">Switch active profile</span>
            </CommandItem>
          </>
        )}
        {view === "profile" && (
          profiles.map(p => (
            <CommandItem
              key={p.id}
              onSelect={() => {
                switchProfile(p.id)
                toast.success(`Switched to ${p.name}`)
                setOpen(false)
              }}
            >
              {p.name}
              {p.id === activeProfile?.id && <span className="ml-auto text-primary">✓</span>}
            </CommandItem>
          ))
        )}
      </CommandList>
    </CommandDialog>
  )
}
```

## Profile Context Pattern

```tsx
// contexts/profile-context.tsx
"use client"
import { createContext, useContext, useState } from "react"

interface Profile {
  id: string
  name: string
}

interface ProfileContextValue {
  profiles: Profile[]
  activeProfile: Profile | null
  switchProfile: (id: string) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => apiFetch<{ profiles: Profile[] }>("/v1/profiles"),
  })

  const activeProfile = profiles?.find(p => p.id === activeProfileId) ?? profiles?.[0] ?? null

  const switchProfile = (id: string) => {
    setActiveProfileId(id)
    // Invalidate all queries so they refetch with new profile_id
    queryClient.invalidateQueries({ queryKey: ["sources"] })
    queryClient.invalidateQueries({ queryKey: ["graph"] })
  }

  return (
    <ProfileContext.Provider value={{ profiles: profiles ?? [], activeProfile, switchProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfileContext = () => useContext(ProfileContext)!
```
