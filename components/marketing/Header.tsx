"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Sun, Moon } from "lucide-react"
import { RavenbaseLockup } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/use-theme"

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features",     href: "/#features" },
  { label: "FAQ",          href: "/#faq" },
  { label: "Pricing",      href: "/#pricing" },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isDark, toggle } = useTheme()

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-background border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="Ravenbase home">
            <RavenbaseLockup size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 min-h-11 min-w-11 flex items-center justify-center
                         rounded-lg text-muted-foreground hover:text-foreground
                         hover:bg-secondary transition-colors"
            >
              {mounted && (isDark ? <Sun key="sun" className="size-4" /> : <Moon key="moon" className="size-4" />)}
            </button>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Button asChild className="rounded-full">
              <Link href="/register">Get started →</Link>
            </Button>
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {/* Dark mode toggle in mobile menu */}
            <button
              onClick={toggle}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex items-center gap-2 text-sm py-2 text-muted-foreground
                         hover:text-foreground transition-colors min-h-11"
            >
              {mounted && (isDark ? <Sun key="sun" className="size-4" /> : <Moon key="moon" className="size-4" />)}
              {mounted && (isDark ? "Light mode" : "Dark mode")}
            </button>
            <Link href="/login" className="text-sm py-2 text-muted-foreground">
              Sign in
            </Link>
            <Button asChild className="rounded-full w-full">
              <Link href="/register">Get started →</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
