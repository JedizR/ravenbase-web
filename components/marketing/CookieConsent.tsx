"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const CONSENT_KEY = "ravenbase-cookie-consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hasPostHog = !!process.env.NEXT_PUBLIC_POSTHOG_KEY
    const hasConsent = localStorage.getItem(CONSENT_KEY) !== null
    setVisible(hasPostHog && !hasConsent)
  }, [])

  if (!visible) return null

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted")
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined")
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 shadow-lg"
    >
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 text-center sm:text-left">
          <p id="cookie-consent-title" className="text-sm font-medium text-foreground mb-1">
            Cookie preferences
          </p>
          <p id="cookie-consent-desc" className="text-xs text-muted-foreground leading-relaxed">
            We use analytics cookies to improve Ravenbase. Essential cookies (authentication) are always active.{" "}
            <Link href="/privacy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </Link>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={accept} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] px-6">
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={decline} className="rounded-full border-border hover:bg-secondary min-h-[44px] px-6">
            Decline
          </Button>
        </div>
      </div>
    </div>
  )
}