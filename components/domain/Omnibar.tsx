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
} from "@/components/ui/command"
import { toast } from "sonner"
import { useProfile } from "@/contexts/ProfileContext"
import { useDebounce } from "@/hooks/use-debounce"
import { useApiFetch } from "@/lib/api-client"
import type { Profile } from "@/contexts/ProfileContext"

// ---------------------------------------------------------------------------
// Slash command types
// ---------------------------------------------------------------------------

type CommandType = "profile" | "ingest" | "inbox" | "graph" | "unknown"

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
    inbox: "inbox",
    graph: "graph",
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
  // Simple includes — if query is empty, match all
  if (!q) return true
  // Fuzzy: all chars in query appear in order in name
  let ni = 0
  for (const ch of q) {
    const idx = n.indexOf(ch, ni)
    if (idx === -1) return false
    ni = idx + 1
  }
  return true
}

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

  // Global "/" key shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape" && open) {
        setOpen(false)
        setValue("")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  const cmd = parseSlashCommand(debouncedValue)

  const matchedProfiles =
    cmd.type === "profile" && cmd.query
      ? profiles.filter((p) => fuzzyMatch(cmd.query, p.name))
      : profiles

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

  const handleSelectNav = useCallback(
    (href: string) => {
      router.push(href)
      setOpen(false)
      setValue("")
    },
    [router]
  )

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setValue("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`} aria-label="Command palette">
      <div
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v)
        }}
        aria-label="Open command menu"
      >
        {/* Omnibar trigger pill — always visible */}
        <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-full px-4 py-2.5 text-sm font-mono text-muted-foreground cursor-text select-none">
          <span className="opacity-60">/</span>
          <span className="flex-1">Type a command…</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50">
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
              placeholder="Type /profile or /ingest…"
              className="rounded-none border-0 border-b border-border"
            />
            <CommandList className="max-h-[320px]">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {value
                  ? `No match for "${value}"`
                  : "Start typing / to see commands"}
              </CommandEmpty>

              {/* /profile command */}
              {cmd.type === "profile" && (
                <CommandGroup heading="PROFILES" className="p-2">
                  {matchedProfiles.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No profiles matching "{cmd.query}"
                    </div>
                  )}
                  {matchedProfiles.map((profile) => (
                    <CommandItem
                      key={profile.id}
                      value={`profile ${profile.name}`}
                      onSelect={() => handleSelectProfile(profile)}
                      className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl"
                    >
                      {profile.color ? (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: profile.color }}
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-muted shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span className="flex-1 truncate">{profile.name}</span>
                      {profile.id === activeProfile?.id && (
                        <span className="text-xs font-mono text-primary">ACTIVE</span>
                      )}
                      {profile.is_default && (
                        <span className="text-xs font-mono text-muted-foreground">
                          DEFAULT
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Navigation commands */}
              {(cmd.type === "unknown" || cmd.type === "ingest" || cmd.type === "inbox" || cmd.type === "graph") && (
                <CommandGroup heading="NAVIGATION" className="p-2">
                  <CommandItem
                    value="nav inbox"
                    onSelect={() => handleSelectNav("/inbox")}
                    className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-16">
                      ◆
                    </span>
                    <span>Memory Inbox</span>
                  </CommandItem>
                  <CommandItem
                    value="nav graph"
                    onSelect={() => handleSelectNav("/graph")}
                    className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-16">
                      ◆
                    </span>
                    <span>Graph Explorer</span>
                  </CommandItem>
                  <CommandItem
                    value="nav sources"
                    onSelect={() => handleSelectNav("/sources")}
                    className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-16">
                      ◆
                    </span>
                    <span>Sources</span>
                  </CommandItem>
                  <CommandItem
                    value="nav settings"
                    onSelect={() => handleSelectNav("/settings")}
                    className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-16">
                      ◆
                    </span>
                    <span>Settings</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
