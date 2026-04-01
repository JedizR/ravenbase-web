"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FileCheck, Mail, Bell, BellOff, CheckCircle2, Zap } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useApiFetch } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationPrefs {
  notify_welcome: boolean
  notify_low_credits: boolean
  notify_ingestion_complete: boolean
}

// ---------------------------------------------------------------------------
// Email Preview Card — sub-component
// ---------------------------------------------------------------------------

interface EmailPreviewCardProps {
  type: "welcome" | "low_credits" | "ingestion_complete"
  label: string
  description: string
  previewLines: string[]
  testMutation: {
    isPending: boolean
    mutate: (variables: {
      emailType: "welcome" | "low_credits" | "ingestion_complete"
    }) => void
  }
}

function EmailPreviewCard({
  type,
  label,
  description,
  previewLines,
  testMutation,
}: EmailPreviewCardProps) {
  const isSending = testMutation.isPending

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      {/* Card header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            {type === "welcome" && <Mail className="w-5 h-5 text-primary" />}
            {type === "low_credits" && <Zap className="w-5 h-5 text-[var(--warning)]" />}
            {type === "ingestion_complete" && (
              <FileCheck className="w-5 h-5 text-[var(--success)]" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{label}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {/* Send test button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => testMutation.mutate({ emailType: type })}
          disabled={isSending}
          className="rounded-full text-xs h-8 px-3"
          aria-label={`Send test ${label} email`}
        >
          {isSending ? (
            <>
              <span className="mr-1.5 inline-block w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            "Send test"
          )}
        </Button>
      </div>

      {/* Email mockup */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Green header bar */}
        <div className="bg-primary px-4 py-3 flex items-center gap-2">
          <span className="text-primary-foreground text-xs font-mono tracking-wider">
            RAVENBASE
          </span>
          <span className="text-primary-foreground/40 text-xs">·</span>
          <span className="text-primary-foreground/60 text-xs font-mono">
            WHAT HAPPENED, WHERE, AND WHEN. ALWAYS.
          </span>
        </div>
        {/* Email body */}
        <div className="bg-background p-4 space-y-2">
          {previewLines.map((line, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "font-serif text-base font-semibold text-foreground"
                  : "text-xs text-muted-foreground"
              }
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toggle Row — sub-component
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  icon: React.ReactNode
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  icon,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">{icon}</div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {checked ? (
          <CheckCircle2 className="w-4 h-4 text-[var(--success)] mr-2" aria-hidden="true" />
        ) : (
          <BellOff className="w-4 h-4 text-muted-foreground mr-2" aria-hidden="true" />
        )}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="data-[state=checked]:bg-primary"
          aria-label={label}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()

  // Fetch current notification preferences
  const { data: prefs, isLoading } = useQuery<NotificationPrefs>({
    queryKey: ["notification-prefs"],
    queryFn: () =>
      apiFetch<NotificationPrefs>("/v1/account/notification-preferences"),
    staleTime: 60_000,
  })

  // Update mutation (PATCH)
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<NotificationPrefs>) =>
      apiFetch("/v1/account/notification-preferences", {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-prefs"] })
      toast.success("Preferences saved")
    },
    onError: () => {
      toast.error("Failed to save preferences. Please try again.")
    },
  })

  // Test email mutation (POST)
  const testMutation = useMutation({
    mutationFn: ({
      emailType,
    }: {
      emailType: "welcome" | "low_credits" | "ingestion_complete"
    }) =>
      apiFetch(`/v1/account/notification-prefs/test/${emailType}`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Test email sent. Check your inbox.")
    },
    onError: () => {
      toast.error(
        "Failed to send test email. Check your Resend API key in .env."
      )
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl text-foreground">
          Notification Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which emails Ravenbase sends you.
        </p>
      </div>

      {/* ◆ EMAIL_NOTIFICATIONS section */}
      <section aria-labelledby="email-notifications-heading">
        <span
          id="email-notifications-heading"
          className="text-xs font-mono text-muted-foreground tracking-wider"
        >
          ◆ EMAIL_NOTIFICATIONS
        </span>

        {/* Toggle rows */}
        <div className="bg-card rounded-2xl border border-border px-6 mt-3">
          <ToggleRow
            label="Welcome email"
            description="Sent once when you create your account"
            icon={<Mail className="w-4 h-4 text-primary" aria-hidden="true" />}
            checked={prefs?.notify_welcome ?? true}
            onCheckedChange={(checked) =>
              updateMutation.mutate({ notify_welcome: checked })
            }
          />
          <ToggleRow
            label="Low credits warning"
            description="Sent when your balance falls below 10%"
            icon={<Zap className="w-4 h-4 text-[var(--warning)]" aria-hidden="true" />}
            checked={prefs?.notify_low_credits ?? true}
            onCheckedChange={(checked) =>
              updateMutation.mutate({ notify_low_credits: checked })
            }
          />
          <ToggleRow
            label="Processing complete"
            description="Sent when large file uploads finish (files over 2MB)"
            icon={
              <FileCheck
                className="w-4 h-4 text-[var(--success)]"
                aria-hidden="true"
              />
            }
            checked={prefs?.notify_ingestion_complete ?? true}
            onCheckedChange={(checked) =>
              updateMutation.mutate({ notify_ingestion_complete: checked })
            }
          />
        </div>
      </section>

      {/* ◆ EMAIL_PREVIEW section */}
      <section aria-labelledby="email-preview-heading">
        <span
          id="email-preview-heading"
          className="text-xs font-mono text-muted-foreground tracking-wider"
        >
          ◆ EMAIL_PREVIEW
        </span>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Click &quot;Send test&quot; to receive a sample of each email at your
          account address.
        </p>

        <div className="grid grid-cols-1 gap-4">
          <EmailPreviewCard
            type="welcome"
            label="Welcome Email"
            description="Your first email from Ravenbase"
            previewLines={[
              "Welcome, [Your Name].",
              "Your exocortex is ready. Start by uploading your notes...",
              "[Open Ravenbase → CTA button]",
            ]}
            testMutation={testMutation}
          />
          <EmailPreviewCard
            type="low_credits"
            label="Low Credits Warning"
            description="Triggers when balance drops below 10%"
            previewLines={[
              "Running low on credits.",
              "You have [X] credits remaining — that's [Y]% of your plan.",
              "[Upgrade to Pro → CTA button]",
            ]}
            testMutation={testMutation}
          />
          <EmailPreviewCard
            type="ingestion_complete"
            label="Processing Complete"
            description="Sent when files over 2MB finish processing"
            previewLines={[
              "[filename].pdf — processed.",
              "[X] memory nodes indexed.",
              "[View Knowledge Graph → CTA button]",
            ]}
            testMutation={testMutation}
          />
        </div>
      </section>
    </div>
  )
}
