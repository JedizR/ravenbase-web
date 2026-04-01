"use client"

import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  Coins,
  FileText,
  GitBranch,
  Inbox,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

import { RavenbaseLogo } from "@/components/brand"
import { ProfileSwitcher } from "@/components/domain/ProfileSwitcher"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getCreditsBalanceV1CreditsBalanceGet, listConflictsV1ConflictsGet } from "@/src/lib/api-client/services.gen"

interface NavItem {
  href: string
  label: string
  monoLabel: string
  icon: React.ElementType
  badge?: string | number
}

export function Sidebar() {
  const pathname = usePathname()

  // Poll conflict count every 30 seconds (AC-5)
  const { data: conflictData } = useQuery({
    queryKey: ["conflicts", "pending"],
    queryFn: () => listConflictsV1ConflictsGet({ status: "pending" }),
    refetchInterval: 30_000,
    staleTime: 30_000,
  })

  // Fetch credits balance (stale after 15s)
  const { data: creditsData } = useQuery({
    queryKey: ["credits", "balance"],
    queryFn: () => getCreditsBalanceV1CreditsBalanceGet(),
    staleTime: 15_000,
  })

  const pendingCount = conflictData?.items.length ?? 0

  const navItems: NavItem[] = [
    {
      href: "/graph",
      label: "Graph Explorer",
      monoLabel: "◆ KNOWLEDGE_GRAPH",
      icon: GitBranch,
    },
    {
      href: "/chat",
      label: "Chat",
      monoLabel: "◆ MEMORY_CHAT",
      icon: MessageSquare,
    },
    {
      href: "/inbox",
      label: "Memory Inbox",
      monoLabel: "◆ MEMORY_INBOX",
      icon: Inbox,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      href: "/workstation",
      label: "Workstation",
      monoLabel: "◆ WORKSTATION",
      icon: Sparkles,
    },
    {
      href: "/sources",
      label: "Sources",
      monoLabel: "◆ SOURCE_FILES",
      icon: FileText,
    },
  ]

  return (
    <aside
      className="hidden lg:flex flex-col w-60 bg-primary text-primary-foreground h-full shrink-0 overflow-y-auto"
      aria-label="Dashboard navigation"
    >
      {/* Logo + profile switcher */}
      <div className="p-4 space-y-3">
        <RavenbaseLogo size="sm" color="currentColor" />
        <ProfileSwitcher variant="sidebar" />
      </div>

      <Separator className="bg-primary-foreground/10" />

      {/* Primary nav */}
      <nav className="flex-1 p-3 space-y-1" aria-label="Primary">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors min-h-[44px]",
                isActive
                  ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn("w-4 h-4 shrink-0", isActive ? "opacity-90" : "opacity-60")}
                aria-hidden="true"
              />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className="bg-warning text-[var(--warning-foreground)] text-xs font-mono rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-primary-foreground/10" />

      {/* Secondary nav */}
      <nav className="p-3 space-y-1" aria-label="Secondary">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors min-h-[44px]",
            pathname.startsWith("/settings")
              ? "bg-primary-foreground/15 text-primary-foreground font-medium"
              : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          )}
          aria-current={
            pathname.startsWith("/settings") ? "page" : undefined
          }
        >
          <Settings
            className={cn(
              "w-4 h-4 shrink-0",
              pathname.startsWith("/settings")
                ? "opacity-90"
                : "opacity-60"
            )}
            aria-hidden="true"
          />
          <span>Settings</span>
        </Link>
      </nav>

      <Separator className="bg-primary-foreground/10" />

      {/* Credits footer */}
      <div className="p-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-foreground/10 text-xs text-primary-foreground/60">
          <Coins className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
          <span className="font-mono">◆ CREDITS</span>
          <span className="ml-auto font-mono text-primary-foreground/80">
            {creditsData?.balance ?? "—"}
          </span>
        </div>
      </div>
    </aside>
  )
}
