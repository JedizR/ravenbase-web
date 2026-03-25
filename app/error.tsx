"use client"
import { useEffect } from "react"
import { RavenbaseLockup } from "@/components/brand"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <RavenbaseLockup size="md" />
      <div className="mt-12 text-center max-w-sm">
        <p className="font-mono text-xs text-muted-foreground tracking-wider mb-4">◆ SYSTEM_ERROR</p>
        <h2 className="font-serif text-4xl mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-8">An unexpected error occurred. Your memory graph data is safe.</p>
        <button onClick={reset} className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-colors">
          Try again
        </button>
      </div>
    </div>
  )
}
