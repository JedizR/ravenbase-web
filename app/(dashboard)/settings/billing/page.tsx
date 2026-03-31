"use client"

import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ExternalLink, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface UserProfile {
  tier: string
  credits_balance: number
}

interface PortalResponse {
  portal_url: string
}

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
}

export default function BillingPage() {
  const { isLoaded } = useUser()
  const apiFetch = useApiFetch()

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["users", "me", "billing"],
    queryFn: () => apiFetch<UserProfile>("/v1/users/me"),
    enabled: isLoaded,
    staleTime: 30_000,
  })

  const portalMutation = useMutation({
    mutationFn: () =>
      apiFetch<PortalResponse>("/v1/billing/create-portal-session", { method: "POST" }),
    onSuccess: (data) => {
      window.location.href = data.portal_url
    },
    onError: () => {
      toast.error("Could not open billing portal. Try again.")
    },
  })

  const tier = profile?.tier ?? "free"
  const isPaid = tier !== "free"

  if (isLoading || !isLoaded) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <main id="main-content" className="p-6 max-w-2xl space-y-6">
      <div>
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          ◆ BILLING_SETTINGS
        </span>
        <h1 className="font-serif text-3xl text-foreground mt-2">Billing</h1>
      </div>

      {/* Current plan card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-mono tracking-wider mb-1">
              CURRENT_PLAN
            </p>
            <p className="font-serif text-2xl text-foreground">
              {TIER_LABELS[tier] ?? tier}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            Credits balance:
          </span>
          <span className="font-mono text-xs text-foreground font-medium">
            {profile?.credits_balance ?? 0}
          </span>
        </div>

        {isPaid ? (
          <Button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            variant="outline"
            className="rounded-full h-11"
          >
            {portalMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Opening portal...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Manage subscription
              </span>
            )}
          </Button>
        ) : (
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground
                       px-6 py-3 rounded-full font-sans text-sm font-medium h-11
                       hover:bg-primary/90 transition-colors"
          >
            Upgrade to Pro
          </a>
        )}
      </div>

      {!isPaid && (
        <p className="text-xs text-muted-foreground font-sans">
          Upgrade to Pro for 2,000 credits/month, unlimited uploads, and Claude Sonnet access.
        </p>
      )}
    </main>
  )
}
