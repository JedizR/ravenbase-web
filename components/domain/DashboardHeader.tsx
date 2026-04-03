"use client"

import { Menu } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Omnibar } from "@/components/domain/Omnibar"
import { ThemeToggle } from "@/components/domain/ThemeToggle"

interface DashboardHeaderProps {
  /** Called to open the mobile sidebar */
  onMenuOpen: () => void
}

export function DashboardHeader({ onMenuOpen }: DashboardHeaderProps) {
  return (
    <header
      className="flex items-center gap-4 px-4 py-3 border-b border-border bg-background"
      aria-label="Dashboard header"
    >
      {/* Mobile menu toggle — only visible on mobile */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors min-h-11 min-w-11 flex items-center justify-center"
        aria-label="Open navigation menu"
        aria-expanded={false}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Omnibar — full width on mobile, fixed width on desktop */}
      <div className="flex-1 max-w-md">
        <Omnibar />
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
              userButtonPopoverCard: "rounded-2xl shadow-lg border border-border",
            },
          }}
        />
      </div>
    </header>
  )
}
