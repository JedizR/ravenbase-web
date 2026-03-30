"use client"

import { Briefcase, ChevronDown, Circle } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProfile } from "@/contexts/ProfileContext"
import type { Profile } from "@/contexts/ProfileContext"

interface ProfileSwitcherProps {
  /** Set to true when used inside the mobile sidebar (forest green background) */
  variant?: "sidebar" | "header"
}

export function ProfileSwitcher({ variant = "sidebar" }: ProfileSwitcherProps) {
  const { profiles, activeProfile, setActiveProfile } = useProfile()

  function handleSwitch(profile: Profile) {
    if (profile.id === activeProfile?.id) return
    setActiveProfile(profile)
    toast.success(`Switched to ${profile.name}`, { duration: 2000 })
  }

  if (!activeProfile) {
    return (
      <div
        className={
          variant === "sidebar"
            ? "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-primary-foreground/50"
            : "flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground"
        }
      >
        <Briefcase className="w-3 h-3" />
        <span>Loading…</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          variant === "sidebar"
            ? "flex items-center gap-2 px-2 py-1.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg text-xs text-primary-foreground/80 hover:bg-primary-foreground/20 transition-colors outline-none cursor-pointer min-h-[44px] w-full"
            : "flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-secondary transition-colors outline-none cursor-pointer min-h-[44px]"
        }
        aria-label="Switch profile"
      >
        <Briefcase className="w-3 h-3 opacity-60 shrink-0" />
        <span className="flex-1 text-left truncate">{activeProfile.name}</span>
        {activeProfile.color && (
          <Circle
            className="w-2 h-2 shrink-0"
            fill={activeProfile.color}
            stroke="none"
            aria-hidden="true"
          />
        )}
        <ChevronDown className="w-3 h-3 opacity-40 shrink-0" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="min-w-[200px]"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-xs font-mono text-muted-foreground">
          SWITCH_PROFILE
        </DropdownMenuLabel>
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => handleSwitch(profile)}
            className="flex items-center gap-2 cursor-pointer"
            aria-current={profile.id === activeProfile.id ? "true" : undefined}
          >
            {profile.color ? (
              <Circle
                className="w-2.5 h-2.5 shrink-0"
                fill={profile.color}
                stroke="none"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="w-2.5 h-2.5 shrink-0 opacity-30"
                fill="currentColor"
                stroke="none"
                aria-hidden="true"
              />
            )}
            <span className="flex-1 truncate">{profile.name}</span>
            {profile.is_default && (
              <span className="text-xs font-mono text-muted-foreground">DEFAULT</span>
            )}
            {profile.id === activeProfile.id && (
              <span className="text-xs font-mono text-primary">ACTIVE</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            window.location.href = "/settings/profiles"
          }}
          className="cursor-pointer text-muted-foreground focus:text-foreground"
        >
          Manage profiles…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
