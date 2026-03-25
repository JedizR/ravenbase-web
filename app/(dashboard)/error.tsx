"use client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <p className="font-mono text-xs text-muted-foreground tracking-wider mb-4">◆ PAGE_ERROR</p>
      <h2 className="font-serif text-2xl mb-2">This page failed to load</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">Your data is safe. This was likely a temporary glitch.</p>
      <Button onClick={reset}>Reload page</Button>
    </div>
  )
}
