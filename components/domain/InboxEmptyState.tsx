"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function InboxEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Animated checkmark SVG */}
      <div className="relative w-16 h-16">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-16 h-16 text-success"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            className="opacity-20"
          />
          <path
            d="M7 13l3 3 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 24,
              animation: "check-draw 0.4s ease-out forwards",
            }}
          />
        </svg>
      </div>

      <div className="text-center space-y-2">
        <h2 className="font-serif text-2xl">All clear!</h2>
        <p className="text-sm text-muted-foreground">
          Your knowledge graph is fully up to date.
        </p>
      </div>

      <span className="text-xs font-mono text-muted-foreground tracking-wider">
        ◆ ALL_CONFLICTS_RESOLVED
      </span>

      <Button variant="outline" size="sm" asChild>
        <Link href="/sources">Upload more sources</Link>
      </Button>
    </div>
  )
}
