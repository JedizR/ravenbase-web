"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { useApiFetch } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserMe {
  preferred_model: string
}

// ---------------------------------------------------------------------------
// Model options
// ---------------------------------------------------------------------------

const MODEL_OPTIONS = [
  {
    value: "claude-haiku-4-5-20251001",
    label: "Haiku 4.5",
    description: "Fast & efficient — recommended for most users",
    credits: "3 credits/chat · 18 credits/meta-doc",
    badge: "Default",
  },
  {
    value: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    description: "Higher quality synthesis and reasoning",
    credits: "8 credits/chat · 45 credits/meta-doc",
    badge: "Pro",
  },
] as const

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const apiFetch = useApiFetch()
  const [user, setUser] = useState<UserMe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [preferredModel, setPreferredModel] = useState<string>(
    "claude-haiku-4-5-20251001"
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await apiFetch<UserMe>("/v1/users/me")
        if (cancelled) return
        setUser(data)
        setPreferredModel(data.preferred_model)
      } catch {
        // Use defaults if endpoint not yet available
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [apiFetch])

  async function updateModel(model: string) {
    const prev = preferredModel
    setPreferredModel(model) // optimistic
    try {
      await apiFetch("/v1/account/model-preference", {
        method: "PATCH",
        body: JSON.stringify({ preferred_model: model }),
      })
    } catch (err) {
      setPreferredModel(prev)
      toast.error("Failed to update model preference", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your AI model preferences and notification settings.
          </p>
        </div>
        <div className="space-y-3">
          <div className="h-24 rounded-xl bg-secondary/50 animate-pulse" />
          <div className="h-24 rounded-xl bg-secondary/50 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your AI model preferences.
        </p>
      </div>

      {/* AI Models */}
      <section aria-labelledby="ai-models-heading">
        <div className="mb-4">
          <h2
            id="ai-models-heading"
            className="font-mono text-xs text-muted-foreground tracking-wider"
          >
            ◆ AI_MODELS
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose the model used for memory chat and meta-document generation.
          </p>
        </div>

        <div className="space-y-3">
          {MODEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateModel(option.value)}
              className={`w-full p-4 rounded-xl border text-left transition-colors ${
                preferredModel === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              aria-pressed={preferredModel === option.value}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{option.label}</span>
                <Badge
                  variant={option.badge === "Default" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {option.badge}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {option.credits}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Link to notifications settings */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-3">
          Notification preferences are managed separately.
        </p>
        <a
          href="/settings/notifications"
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          Manage notification settings
        </a>
      </div>
    </div>
  )
}
