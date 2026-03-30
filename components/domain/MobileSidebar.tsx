"use client"

import {
  Coins,
  FileText,
  GitBranch,
  Inbox,
  Settings,
  Sparkles,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { RavenbaseLogo } from "@/components/brand"
import { ProfileSwitcher } from "@/components/domain/ProfileSwitcher"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface MobileSidebarProps {
  /** Whether the sheet is open — controlled by parent */
  open: boolean
  /** Called when the sheet should close */
  onClose: () => void
}

const NAV_ITEMS = [
  { href: "/dashboard/graph", label: "Graph Explorer", monoLabel: "◆ KNOWLEDGE_GRAPH", icon: GitBranch },
  { href: "/dashboard/inbox", label: "Memory Inbox", monoLabel: "◆ MEMORY_INBOX", icon: Inbox },
  { href: "/dashboard/workstation", label: "Workstation", monoLabel: "◆ WORKSTATION", icon: Sparkles },
  { href: "/dashboard/sources", label: "Sources", monoLabel: "◆ SOURCE_FILES", icon: FileText },
]

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        className="w-72 bg-primary text-primary-foreground p-0 flex flex-col gap-0 h-full"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <RavenbaseLogo size="sm" color="currentColor" />
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile switcher */}
        <div className="px-4 pb-3">
          <ProfileSwitcher variant="sidebar" />
        </div>

        <Separator className="bg-primary-foreground/10" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors min-h-[44px]",
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
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <Separator className="bg-primary-foreground/10" />

        {/* Settings */}
        <div className="p-3 space-y-1">
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors min-h-[44px]",
              pathname.startsWith("/dashboard/settings")
                ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            )}
          >
            <Settings className="w-4 h-4 opacity-60" aria-hidden="true" />
            <span>Settings</span>
          </Link>
        </div>

        <Separator className="bg-primary-foreground/10" />

        {/* Credits */}
        <div className="p-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-foreground/10 text-xs text-primary-foreground/60">
            <Coins className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
            <span className="font-mono">◆ CREDITS</span>
            <span className="ml-auto font-mono text-primary-foreground/80">— —</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
