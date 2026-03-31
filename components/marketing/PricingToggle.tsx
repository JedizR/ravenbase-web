// components/marketing/PricingToggle.tsx
"use client"

interface PricingToggleProps {
  isAnnual: boolean
  onToggle: (annual: boolean) => void
}

export function PricingToggle({ isAnnual, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center gap-4 justify-center">
      <button
        onClick={() => onToggle(false)}
        className={`text-sm font-sans transition-colors ${
          !isAnnual
            ? "text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={!isAnnual}
      >
        Monthly
      </button>
      <button
        role="switch"
        aria-checked={isAnnual}
        onClick={() => onToggle(!isAnnual)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isAnnual ? "bg-primary" : "bg-secondary border border-border"
        }`}
        aria-label="Toggle annual billing"
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            isAnnual ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`text-sm font-sans transition-colors flex items-center gap-2 ${
          isAnnual
            ? "text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={isAnnual}
      >
        Annual
        <span className="text-xs font-mono text-success bg-success/10 px-2 py-0.5 rounded-full">
          2 months free
        </span>
      </button>
    </div>
  )
}
