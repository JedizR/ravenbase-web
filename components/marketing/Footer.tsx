import Link from "next/link"
import { RavenbaseLockup } from "@/components/brand"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">
          <div className="space-y-3">
            <RavenbaseLockup size="sm" />
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              Human-AI long-term context memory. Your knowledge, permanent and queryable.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">◆ DIRECTORY</p>
            <nav aria-label="Product navigation">
              <ul className="space-y-2">
                <li>
                  <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Product Tour
                  </a>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">◆ LEGAL</p>
            <nav aria-label="Legal navigation">
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ ALL_SYSTEMS_OPERATIONAL</p>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span>MEMORY_LAYER_V1.0</span>
            <span>US-WEST-2 [ACTIVE]</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Ravenbase</p>
        </div>
      </div>
    </footer>
  )
}
