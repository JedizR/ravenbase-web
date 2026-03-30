"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useApiFetch } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserMe {
  preferred_model: string
  notify_welcome: boolean
  notify_low_credits: boolean
  notify_ingestion_complete: boolean
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
// Notification options
// ---------------------------------------------------------------------------

const NOTIFICATION_OPTIONS = [
  {
    key: "notify_welcome" as const,
    label: "Welcome email",
    description: "Sent once when you first create your account.",
  },
  {
    key: "notify_low_credits" as const,
    label: "Low credits warning",
    description: "Sent when your credit balance drops below 10% of your plan.",
  },
  {
    key: "notify_ingestion_complete" as const,
    label: "Ingestion complete",
    description: "Sent when a large file (>2MB) finishes processing.",
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
  const [notifications, setNotifications] = useState({
    notify_welcome: true,
    notify_low_credits: true,
    notify_ingestion_complete: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await apiFetch<UserMe>("/v1/users/me")
        if (cancelled) return
        setUser(data)
        setPreferredModel(data.preferred_model)
        setNotifications({
          notify_welcome: data.notify_welcome,
          notify_low_credits: data.notify_low_credits,
          notify_ingestion_complete: data.notify_ingestion_complete,
        })
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

  async function updateNotification(
    key: (typeof NOTIFICATION_OPTIONS)[number]["key"],
    value: boolean
  ) {
    const prev = { ...notifications }
    setNotifications((n) => ({ ...n, [key]: value })) // optimistic
    try {
      await apiFetch("/v1/account/notification-preferences", {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      })
    } catch (err) {
      setNotifications(prev)
      toast.error("Failed to update notification preference", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your AI model preferences and notification settings.
        </p>
      </div>

      {/* AI Models */}
      <section aria-labelledby="ai-models-heading">
        <div className="mb-4">
          <h2 id="ai-models-heading" className="font-mono text-xs text-muted-foreground tracking-wider">
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

      <Separator />

      {/* Notifications */}
      <section aria-labelledby="notifications-heading">
        <div className="mb-4">
          <h2 id="notifications-heading" className="font-mono text-xs text-muted-foreground tracking-wider">
            ◆ NOTIFICATIONS
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose which emails Ravenbase sends you.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {NOTIFICATION_OPTIONS.map((opt) => (
            <div
              key={opt.key}
              className="flex items-center justify-between px-4 py-4 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {opt.description}
                </p>
              </div>
              <Switch
                checked={notifications[opt.key]}
                onCheckedChange={(checked) =>
                  updateNotification(opt.key, checked)
                }
                aria-label={opt.label}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Save indicator */}
      {isSaving && (
        <p className="text-xs text-muted-foreground font-mono animate-pulse">
          ◆ SAVING…
        </p>
      )}
    </div>
  )
}
