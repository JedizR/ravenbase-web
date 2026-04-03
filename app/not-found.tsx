import Link from "next/link"
import { RavenbaseLockup } from "@/components/brand"

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-8">
      <RavenbaseLockup size="md" />
      <div className="mt-12 text-center max-w-sm">
        <p className="font-mono text-xs text-muted-foreground tracking-wider mb-4">◆ ERROR_404</p>
        <h1 className="font-serif text-4xl mb-4">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          This memory doesn&apos;t exist in your knowledge graph.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-border text-foreground rounded-full font-medium text-sm hover:bg-secondary transition-colors"
          >
            Home
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
