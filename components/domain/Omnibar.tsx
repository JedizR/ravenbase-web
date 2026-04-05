"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { toast } from "sonner"
import { useProfile } from "@/contexts/ProfileContext"
import { useDebounce } from "@/hooks/use-debounce"
import { useApiFetch } from "@/lib/api-client"
import type { Profile } from "@/contexts/ProfileContext"
import {
  MessageSquare,
  Search,
  Upload,
  Inbox,
  Settings,
  FileText,
  Moon,
  Sun,
  CreditCard,
  User,
  Download,
  Share2,
  Palette,
  PenTool,
  LogOut,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Slash command types
// ---------------------------------------------------------------------------

type CommandType = "profile" | "ingest" | "nav" | "action" | "unknown"

interface ParsedCommand {
  type: CommandType
  raw: string
  query: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseSlashCommand(input: string): ParsedCommand {
  const trimmed = input.trim()
  if (!trimmed.startsWith("/")) {
    return { type: "unknown", raw: input, query: input }
  }

  const spaceIdx = trimmed.indexOf(" ")
  const cmd = spaceIdx === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIdx)
  const query = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1)

  const MAP: Record<string, CommandType> = {
    profile: "profile",
    ingest: "ingest",
    chat: "nav",
    graph: "nav",
    inbox: "nav",
    sources: "nav",
    settings: "nav",
    workstation: "nav",
    theme: "action",
    export: "action",
    upgrade: "action",
  }

  return {
    type: MAP[cmd.toLowerCase()] ?? "unknown",
    raw: trimmed,
    query,
  }
}

function fuzzyMatch(query: string, name: string): boolean {
  const q = query.toLowerCase()
  const n = name.toLowerCase()
  if (!q) return true
  let ni = 0
  for (const ch of q) {
    const idx = n.indexOf(ch, ni)
    if (idx === -1) return false
    ni = idx + 1
  }
  return true
}

/** Format keyboard shortcut for display */
function Kbd({ children, className }: { children: string; className?: string }) {
  return (
    <kbd
      className={`hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </kbd>
  )
}

// ---------------------------------------------------------------------------
// Navigation items with shortcuts
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: "Graph Explorer", href: "/graph", icon: Search, shortcut: "⌘1", key: "1" },
  { label: "Chat", href: "/chat", icon: MessageSquare, shortcut: "⌘2", key: "2" },
  { label: "Memory Inbox", href: "/inbox", icon: Inbox, shortcut: "⌘3", key: "3" },
  { label: "Workstation", href: "/workstation", icon: PenTool, shortcut: "⌘4", key: "4" },
  { label: "Sources", href: "/sources", icon: Upload, shortcut: "⌘5", key: "5" },
  { label: "Settings", href: "/settings", icon: Settings, shortcut: "⌘,", key: "," },
] as const

const ACTION_ITEMS = [
  { label: "Toggle dark mode", id: "theme", icon: Moon, shortcut: "⌘D" },
  { label: "Export data", id: "export", icon: Download, shortcut: "⌘E" },
  { label: "Upgrade to Pro", id: "upgrade", icon: CreditCard, shortcut: "" },
  { label: "Invite friends", id: "referral", icon: Share2, shortcut: "" },
  { label: "Manage profiles", id: "profiles", icon: User, shortcut: "" },
  { label: "Billing", id: "billing", icon: CreditCard, shortcut: "" },
] as const

// ---------------------------------------------------------------------------
// Omnibar
// ---------------------------------------------------------------------------

interface OmnibarProps {
  className?: string
}

export function Omnibar({ className }: OmnibarProps) {
  const router = useRouter()
  const { profiles, setActiveProfile, activeProfile } = useProfile()
  const apiFetch = useApiFetch()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const debouncedValue = useDebounce(value, 150)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleIngestText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast.info("Type some text after /ingest")
        return
      }
      const loadingId = toast.loading("Capturing text...")
      try {
        await apiFetch("/v1/ingest/text", {
          method: "POST",
          body: JSON.stringify({
            content: text,
            profile_id: activeProfile?.id ?? null,
            tags: [],
          }),
        })
        toast.dismiss(loadingId)
        toast.success(
          activeProfile ? `Captured to ${activeProfile.name}` : "Captured",
          { duration: 3000 }
        )
        setOpen(false)
        setValue("")
      } catch (err) {
        toast.dismiss(loadingId)
        const msg = err instanceof Error ? err.message : "Ingest failed"
        toast.error("Ingest failed", { description: msg })
      }
    },
    [apiFetch, activeProfile]
  )

  const handleToggleTheme = useCallback(() => {
    const html = document.documentElement
    const isDark = html.classList.contains("dark")
    if (isDark) {
      html.classList.remove("dark")
      localStorage.setItem("ravenbase-theme", "light")
      toast.success("Switched to light mode", { duration: 1500 })
    } else {
      html.classList.add("dark")
      localStorage.setItem("ravenbase-theme", "dark")
      toast.success("Switched to dark mode", { duration: 1500 })
    }
    setOpen(false)
    setValue("")
  }, [])

  const handleAction = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case "theme":
          handleToggleTheme()
          break
        case "export":
          router.push("/settings/data")
          break
        case "upgrade":
          router.push("/pricing")
          break
        case "referral":
          router.push("/settings/referrals")
          break
        case "profiles":
          router.push("/settings/profiles")
          break
        case "billing":
          router.push("/settings/billing")
          break
      }
      setOpen(false)
      setValue("")
    },
    [router, handleToggleTheme]
  )

  const handleSelectNav = useCallback(
    (href: string) => {
      router.push(href)
      setOpen(false)
      setValue("")
    },
    [router]
  )

  const handleSelectProfile = useCallback(
    (profile: Profile) => {
      if (profile.id === activeProfile?.id) {
        toast.info(`Already on ${profile.name}`)
      } else {
        setActiveProfile(profile)
        toast.success(`Switched to ${profile.name}`, { duration: 2000 })
      }
      setOpen(false)
      setValue("")
    },
    [activeProfile, setActiveProfile]
  )

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey

      // ⌘K or / to open
      if ((meta && e.key === "k") || (e.key === "/" && !isInputFocused())) {
        e.preventDefault()
        setOpen(true)
        return
      }

      // Escape to close
      if (e.key === "Escape" && open) {
        setOpen(false)
        setValue("")
        return
      }

      // ⌘D toggle dark mode
      if (meta && e.key === "d" && !isInputFocused()) {
        e.preventDefault()
        handleToggleTheme()
        return
      }

      // ⌘E export data
      if (meta && e.key === "e" && !isInputFocused()) {
        e.preventDefault()
        router.push("/settings/data")
        return
      }

      // ⌘1-5 navigation shortcuts
      if (meta && !e.shiftKey) {
        const navItem = NAV_ITEMS.find((item) => item.key === e.key)
        if (navItem) {
          e.preventDefault()
          router.push(navItem.href)
          return
        }
      }

      // ⌘, settings shortcut
      if (meta && e.key === ",") {
        e.preventDefault()
        router.push("/settings")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, router, handleToggleTheme])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setValue("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const cmd = parseSlashCommand(debouncedValue)
  const matchedProfiles =
    cmd.type === "profile" && cmd.query
      ? profiles.filter((p) => fuzzyMatch(cmd.query, p.name))
      : profiles

  // Filter nav items by search query
  const queryLower = debouncedValue.toLowerCase()
  const filteredNav =
    cmd.type === "unknown" && queryLower
      ? NAV_ITEMS.filter((item) =>
          item.label.toLowerCase().includes(queryLower)
        )
      : NAV_ITEMS

  const filteredActions =
    cmd.type === "unknown" && queryLower
      ? ACTION_ITEMS.filter((item) =>
          item.label.toLowerCase().includes(queryLower)
        )
      : ACTION_ITEMS

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? ""}`}
      aria-label="Command palette"
    >
      {/* Trigger pill — hidden on mobile to save space */}
      <div
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v)
        }}
        aria-label="Open command menu"
        className="hidden sm:block"
      >
        <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-full px-4 py-2.5 text-sm font-mono text-muted-foreground cursor-text select-none hover:bg-secondary/80 transition-colors">
          <span className="opacity-60">/</span>
          <span className="flex-1">Type a command…</span>
          <Kbd>⌘K</Kbd>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:top-full sm:mt-2">
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-black/40 sm:hidden"
            onClick={() => {
              setOpen(false)
              setValue("")
            }}
          />
          <div className="relative mx-4 mt-20 sm:mx-0 sm:mt-0">
            <Command
              className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
              loop
            >
              <CommandInput
                ref={inputRef}
                value={value}
                onValueChange={setValue}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    const trimmed = value.trim()
                    if (trimmed.startsWith("/ingest ")) {
                      const text = trimmed.slice("/ingest ".length)
                      handleIngestText(text)
                    } else if (trimmed === "/ingest") {
                      toast.info("Type some text after /ingest")
                    }
                  }
                }}
                placeholder="Search or type /command…"
                className="rounded-none border-0 border-b border-border"
              />
              <CommandList className="max-h-100">
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  {value
                    ? `No results for "${value}"`
                    : "Type to search or use / commands"}
                </CommandEmpty>

                {/* Slash commands help — show when typing / */}
                {value === "/" && (
                  <CommandGroup heading="◆ COMMANDS" className="p-2">
                    <CommandItem disabled className="text-xs text-muted-foreground opacity-70">
                      /profile [name] — switch profile
                    </CommandItem>
                    <CommandItem disabled className="text-xs text-muted-foreground opacity-70">
                      /ingest [text] — capture text to memory
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* /profile command */}
                {cmd.type === "profile" && (
                  <CommandGroup heading="◆ PROFILES" className="p-2">
                    {matchedProfiles.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No profiles matching &ldquo;{cmd.query}&rdquo;
                      </div>
                    )}
                    {matchedProfiles.map((profile) => (
                      <CommandItem
                        key={profile.id}
                        value={`profile ${profile.name}`}
                        onSelect={() => handleSelectProfile(profile)}
                        className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: profile.color || "var(--muted)",
                          }}
                          aria-hidden="true"
                        />
                        <span className="flex-1 truncate">{profile.name}</span>
                        {profile.id === activeProfile?.id && (
                          <span className="text-xs font-mono text-primary">
                            ACTIVE
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Navigation commands — always visible unless in slash command */}
                {(cmd.type === "unknown" || cmd.type === "nav") &&
                  filteredNav.length > 0 && (
                    <CommandGroup heading="◆ NAVIGATE" className="p-2">
                      {filteredNav.map((item) => (
                        <CommandItem
                          key={item.href}
                          value={`go ${item.label}`}
                          onSelect={() => handleSelectNav(item.href)}
                          className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl"
                        >
                          <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                {(cmd.type === "unknown" || cmd.type === "action") &&
                  filteredActions.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="◆ ACTIONS" className="p-2">
                        {filteredActions.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`action ${item.label}`}
                            onSelect={() => handleAction(item.id)}
                            className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl"
                          >
                            <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
              </CommandList>

              {/* Footer with keyboard hint */}
              <div className="border-t border-border px-3 py-2 flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Kbd className="inline-flex!">↑↓</Kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <Kbd className="inline-flex!">↵</Kbd> select
                </span>
                <span className="flex items-center gap-1">
                  <Kbd className="inline-flex!">esc</Kbd> close
                </span>
              </div>
            </Command>
          </div>
        </div>
      )}
    </div>
  )
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName
  return tag === "INPUT" || tag === "TEXTAREA"
}
