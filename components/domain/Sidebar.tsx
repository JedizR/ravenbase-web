"use client"

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
import { usePathname } from "next/navigation"

import { RavenbaseLogo } from "@/components/brand"
import { ProfileSwitcher } from "@/components/domain/ProfileSwitcher"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  monoLabel: string
  icon: React.ElementType
  badge?: string | number
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard/graph",
    label: "Graph Explorer",
    monoLabel: "◆ KNOWLEDGE_GRAPH",
    icon: GitBranch,
  },
  {
    href: "/dashboard/chat",
    label: "Chat",
    monoLabel: "◆ MEMORY_CHAT",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/inbox",
    label: "Memory Inbox",
    monoLabel: "◆ MEMORY_INBOX",
    icon: Inbox,
    badge: undefined, // TODO: wire up conflict count
  },
  {
    href: "/dashboard/workstation",
    label: "Workstation",
    monoLabel: "◆ WORKSTATION",
    icon: Sparkles,
  },
  {
    href: "/dashboard/sources",
    label: "Sources",
    monoLabel: "◆ SOURCE_FILES",
    icon: FileText,
  },
]

export function Sidebar() {
  const pathname = usePathname()

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
        {NAV_ITEMS.map((item) => {
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
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors min-h-[44px]",
            pathname.startsWith("/dashboard/settings")
              ? "bg-primary-foreground/15 text-primary-foreground font-medium"
              : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          )}
          aria-current={
            pathname.startsWith("/dashboard/settings") ? "page" : undefined
          }
        >
          <Settings
            className={cn(
              "w-4 h-4 shrink-0",
              pathname.startsWith("/dashboard/settings")
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
          {/* TODO: wire up actual credits balance */}
          <span className="ml-auto font-mono text-primary-foreground/80">
            — —
          </span>
        </div>
      </div>
    </aside>
  )
}
