"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

export function ThemeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
        "bg-secondary hover:bg-accent",
        "text-xs font-mono text-muted-foreground",
        "border border-border",
        "min-h-[44px] min-w-[44px]",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      ].join(" ")}
    >
      {isDark ? (
        // Dark mode active → show Sun icon (click to go light)
        <Sun className="w-3.5 h-3.5 text-primary transition-transform duration-300 rotate-180" />
      ) : (
        // Light mode active → show Moon icon (click to go dark)
        <Moon className="w-3.5 h-3.5 text-primary transition-transform duration-300 rotate-0" />
      )}
      <span className="hidden sm:inline">
        {isDark ? "Day" : "Night"}
      </span>
    </button>
  )
}
