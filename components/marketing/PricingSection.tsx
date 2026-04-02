"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Check, X, Zap } from "lucide-react"
import { toast } from "sonner"
import { useApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PricingToggle } from "./PricingToggle"

interface UserProfile {
  tier: string
  is_admin?: boolean
}

interface CheckoutResponse {
  checkout_url: string
}

const TIERS = [
  {
    id: "free" as const,
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    credits: "500",
    label: "◆ FREE_TIER",
    cta: "Get started",
    ctaHref: "/sign-up",
    features: {
      uploads: "10 sources",
      metaDocs: "10 / month",
      profiles: "3 profiles",
      model: "Claude Haiku only",
      chat: true,
      graphExplorer: true,
      teamSharing: false,
      sonnetAccess: false,
    },
  },
  {
    id: "pro" as const,
    name: "Pro",
    monthlyPrice: 15,
    annualPrice: 12,
    credits: "2,000",
    label: "◆ PRO_TIER",
    cta: "Get Pro",
    featured: true,
    features: {
      uploads: "Unlimited",
      metaDocs: "Unlimited",
      profiles: "20 profiles",
      model: "Haiku + Sonnet",
      chat: true,
      graphExplorer: true,
      teamSharing: false,
      sonnetAccess: true,
    },
  },
  {
    id: "team" as const,
    name: "Team",
    monthlyPrice: 49,
    annualPrice: 39,
    credits: "6,000 shared",
    label: "◆ TEAM_TIER",
    cta: "Get Team",
    features: {
      uploads: "Unlimited",
      metaDocs: "Unlimited",
      profiles: "Unlimited",
      model: "Haiku + Sonnet",
      chat: true,
      graphExplorer: true,
      teamSharing: true,
      sonnetAccess: true,
    },
  },
] as const

type TierFeatures = {
  uploads: string
  metaDocs: string
  profiles: string
  model: string
  chat: boolean
  graphExplorer: boolean
  teamSharing: boolean
  sonnetAccess: boolean
}

type FeatureKey = keyof TierFeatures

const COMPARISON_ROWS: Array<{
  label: string
  key: FeatureKey
}> = [
  { label: "Source uploads", key: "uploads" },
  { label: "Meta-Documents / month", key: "metaDocs" },
  { label: "Profiles", key: "profiles" },
  { label: "AI model access", key: "model" },
  { label: "Memory Chat", key: "chat" },
  { label: "Graph Explorer", key: "graphExplorer" },
  { label: "Claude Sonnet access", key: "sonnetAccess" },
  { label: "Cross-user graph sharing (3 seats)", key: "teamSharing" },
]

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)
  const { user: clerkUser, isSignedIn } = useUser()
  const apiFetch = useApiFetch()

  // Fetch current tier for logged-in users (show "Current plan" badge)
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["users", "me", "pricing"],
    queryFn: () => apiFetch<UserProfile>("/v1/users/me"),
    enabled: !!isSignedIn,
    staleTime: 60_000,
  })

  // Suppress unused variable warning — clerkUser is available for future use
  void clerkUser

  const currentTier = userProfile?.tier ?? null
  const isAdmin = userProfile?.is_admin ?? false

  const checkoutMutation = useMutation({
    mutationFn: async ({
      tier,
      period,
    }: {
      tier: "pro" | "team"
      period: "monthly" | "annual"
    }) => {
      const data = await apiFetch<CheckoutResponse>(
        "/v1/billing/create-checkout-session",
        {
          method: "POST",
          body: JSON.stringify({ tier, period }),
        },
      )
      return data
    },
    onSuccess: (data) => {
      try {
        const url = new URL(data.checkout_url)
        if (url.protocol === "https:") {
          window.location.href = data.checkout_url
        } else {
          toast.error("Invalid checkout URL. Please contact support.")
        }
      } catch {
        toast.error("Invalid checkout URL. Please contact support.")
      }
    },
    onError: () => {
      toast.error("Could not start checkout. Try again.")
    },
  })

  const handleCheckout = (tier: "pro" | "team") => {
    if (!isSignedIn) {
      window.location.href = "/sign-up"
      return
    }
    checkoutMutation.mutate({ tier, period: isAnnual ? "annual" : "monthly" })
  }

  if (isAdmin) {
    return (
      <section aria-labelledby="pricing-heading" className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <p className="font-mono text-xs text-muted-foreground tracking-wider">◆ ADMIN_ACCOUNT</p>
          <h2 id="pricing-heading" className="font-serif text-3xl text-foreground">
            Full access bypass active
          </h2>
          <p className="text-muted-foreground">
            All features are unlocked. Credits are disabled for your account.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="pricing-heading"
      className="py-24 bg-background"
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12 space-y-4">
          <span className="text-xs font-mono text-muted-foreground tracking-wider">
            ◆ PRICING_TIERS
          </span>
          <h2
            id="pricing-heading"
            className="font-serif text-4xl md:text-5xl text-foreground"
          >
            Memory that pays for itself
          </h2>
          <p className="font-sans text-lg text-muted-foreground max-w-xl mx-auto">
            Start free. Upgrade when your knowledge graph outgrows the basics.
          </p>
          <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {TIERS.map((tier) => {
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice
            const isCurrentPlan = currentTier === tier.id
            const isFeatured = "featured" in tier && tier.featured

            return (
              <div
                key={tier.id}
                className={`bg-card rounded-2xl p-6 border flex flex-col gap-5 transition-shadow hover:shadow-md ${
                  isFeatured
                    ? "border-2 border-primary shadow-sm"
                    : "border-border"
                }`}
              >
                {/* Tier label + badges */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground tracking-wider">
                    {tier.label}
                  </span>
                  {isFeatured && (
                    <Badge className="bg-primary text-primary-foreground text-xs font-mono">
                      MOST_POPULAR
                    </Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge className="bg-success/10 text-success border border-success/20 text-xs font-mono">
                      CURRENT_PLAN
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <div>
                  <h3 className="font-serif text-2xl text-foreground mb-1">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    {price === 0 ? (
                      <span className="font-sans text-4xl font-semibold text-foreground">
                        Free
                      </span>
                    ) : (
                      <>
                        <span className="font-sans text-4xl font-semibold text-foreground">
                          ${price}
                        </span>
                        <span className="font-sans text-sm text-muted-foreground">
                          /month
                        </span>
                      </>
                    )}
                  </div>
                  {isAnnual && price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Billed ${price * 12}/year
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-mono text-xs">{tier.credits}</span>{" "}
                    credits/month
                  </p>
                </div>

                {/* Key features */}
                <ul className="space-y-2 flex-1">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    {tier.features.uploads} source uploads
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    {tier.features.metaDocs} Meta-Documents
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    {tier.features.profiles}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    {tier.features.model}
                  </li>
                  {tier.features.teamSharing && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      Cross-user graph sharing (3 seats)
                    </li>
                  )}
                </ul>

                {/* CTA */}
                {tier.id === "free" ? (
                  <a
                    href={isCurrentPlan ? "/chat" : tier.ctaHref}
                    className="inline-flex items-center justify-center bg-secondary text-foreground
                               px-6 py-3 rounded-full font-sans text-sm font-medium
                               hover:bg-secondary/80 transition-colors h-11"
                  >
                    {isCurrentPlan ? "Open workspace" : tier.cta}
                  </a>
                ) : (
                  <Button
                    onClick={() => handleCheckout(tier.id as "pro" | "team")}
                    disabled={isCurrentPlan || checkoutMutation.isPending}
                    className={`rounded-full h-11 font-sans ${
                      isFeatured
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {checkoutMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Redirecting...
                      </span>
                    ) : isCurrentPlan ? (
                      "Current plan"
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        {tier.cta}
                      </span>
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* Feature comparison table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground tracking-wider">
              ◆ FEATURE_COMPARISON
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-sans font-medium text-foreground w-1/2">
                    Feature
                  </th>
                  {TIERS.map((tier) => (
                    <th
                      key={tier.id}
                      className={`p-4 font-mono text-xs tracking-wider text-center ${
                        tier.id === "pro"
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tier.name.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={idx % 2 === 0 ? "bg-background/50" : ""}
                  >
                    <td className="p-4 font-sans text-foreground">
                      {row.label}
                    </td>
                    {TIERS.map((tier) => {
                      const val: string | boolean =
                        tier.features[row.key as keyof typeof tier.features]
                      return (
                        <td key={tier.id} className="p-4 text-center">
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check
                                className="w-4 h-4 text-success mx-auto"
                                aria-label="Included"
                              />
                            ) : (
                              <X
                                className="w-4 h-4 text-muted-foreground/40 mx-auto"
                                aria-label="Not included"
                              />
                            )
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground">
                              {val}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
