"use client"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Copy, Check, Linkedin } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import { useApiFetch } from "@/lib/api-client"

interface ReferralResponse {
  referral_code: string
  referral_url: string
  total_referrals: number
  pending_referrals: number
  credits_earned: number
  current_month_count: number
  monthly_cap: number
}

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false)
  const apiFetch = useApiFetch()

  // TanStack Query for referral data
  const { data, isLoading } = useQuery<ReferralResponse>({
    queryKey: ["referral"],
    queryFn: () => apiFetch<ReferralResponse>("/v1/account/referral"),
    staleTime: 30_000,
  })

  const referralUrl = data?.referral_url ?? ""
  const totalReferrals = data?.total_referrals ?? 0
  const creditsEarned = data?.credits_earned ?? 0

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // AC-9b: 2s COPIED state
  }

  // Milestone state
  const milestones = [
    { count: 1, reward: "100 bonus credits", reached: totalReferrals >= 1 },
    { count: 3, reward: "500 bonus credits", reached: totalReferrals >= 3 },
    { count: 5, reward: "1 month Pro free", reached: totalReferrals >= 5 },
  ]
  const nextMilestone = milestones.find((m) => !m.reached)
  const progressPercent = nextMilestone
    ? (totalReferrals / nextMilestone.count) * 100
    : 100

  return (
    <div className="space-y-8">
      {/* Referral link card */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ REFERRAL_LINK</p>

        {/* Read-only URL input */}
        <div className="relative">
          <input
            readOnly
            value={referralUrl}
            className="w-full bg-secondary rounded-xl px-4 py-3 pr-20
                       font-mono text-sm text-foreground
                       border border-border outline-none"
          />
          {/* Copy button — overlays right side */}
          <button
            onClick={handleCopy}
            aria-label={copied ? "Link copied" : "Copy referral link"}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       border border-border bg-card hover:bg-secondary
                       text-xs font-mono transition-all duration-150
                       min-h-[36px]"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-success" />
                <span className="text-success">COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">COPY_LINK</span>
              </>
            )}
          </button>
        </div>

        {/* Social share */}
        <div className="flex gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              "I'm using Ravenbase to build my AI memory. Get 200 free credits: " + referralUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Twitter"
            className="p-2 rounded-full border border-border hover:bg-secondary
                       transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on LinkedIn"
            className="p-2 rounded-full border border-border hover:bg-secondary
                       transition-colors"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Stats card */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ REFERRAL_STATS</p>

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-bold text-primary">
            {isLoading ? "—" : totalReferrals}
          </span>
          <span className="text-sm text-muted-foreground">users referred</span>
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{isLoading ? "—" : creditsEarned}</span> credits earned
        </div>

        {/* Progress bar toward next reward */}
        {nextMilestone && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {nextMilestone.count - totalReferrals} more referral
              {nextMilestone.count - totalReferrals !== 1 ? "s" : ""} to unlock{" "}
              {nextMilestone.reward}
            </p>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Milestone timeline */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
        <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ MILESTONES</p>
        {milestones.map((m, i) => {
          const isNext = !m.reached && milestones.slice(0, i).every((x) => x.reached)
          return (
            <div key={i} className="flex items-center gap-3">
              {m.reached ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              ) : isNext ? (
                <div className="w-5 h-5 rounded-full bg-warning shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-secondary border border-border shrink-0" />
              )}
              <span className={`text-sm ${m.reached ? "text-foreground" : "text-muted-foreground"}`}>
                {m.count} referral{m.count > 1 ? "s" : ""} → {m.reward}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}