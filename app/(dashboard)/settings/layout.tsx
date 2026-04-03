"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  CreditCard,
  Database,
  Gift,
  Settings,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const SETTINGS_NAV = [
  { href: "/settings", label: "General", icon: Settings, exact: true },
  { href: "/settings/profiles", label: "Profiles", icon: Users },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/data", label: "Your Data", icon: Database },
  { href: "/settings/referrals", label: "Referrals", icon: Gift },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-5xl mx-auto">
      {/* Desktop: sidebar nav / Mobile: horizontal scroll tabs */}
      <nav
        className="lg:w-56 shrink-0"
        aria-label="Settings navigation"
      >
        {/* Mobile: horizontal tabs */}
        <div className="flex lg:hidden gap-1 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {SETTINGS_NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Desktop: vertical sidebar */}
        <div className="hidden lg:flex flex-col gap-1">
          {SETTINGS_NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-foreground font-medium border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
