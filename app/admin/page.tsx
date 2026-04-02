"use client"
import { useQuery } from "@tanstack/react-query"
import { Users, Zap, Activity, DollarSign, Database, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiFetch } from "@/lib/api-client"
import Link from "next/link"

interface AdminStats {
  total_users: number
  active_today: number
  new_today: number
  pro_users: number
  daily_llm_spend_usd: number
  llm_spend_cap_usd: number
  sources_today: number
  metadocs_today: number
}

export default function AdminDashboardPage() {
  const apiFetch = useApiFetch()

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch<AdminStats>("/v1/admin/stats"),
    staleTime: 30_000,
  })

  const statCards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users },
    { label: "Active Today", value: stats?.active_today ?? 0, icon: Activity },
    { label: "New Today", value: stats?.new_today ?? 0, icon: Zap },
    { label: "Pro Users", value: stats?.pro_users ?? 0, icon: DollarSign },
    { label: "Sources Today", value: stats?.sources_today ?? 0, icon: Database },
    { label: "MetaDocs Today", value: stats?.metadocs_today ?? 0, icon: FileText },
  ]

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time metrics — refreshes every 30 seconds
          </p>
        </div>
        <Link
          href="/admin/users"
          className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground
                     text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Manage Users →
        </Link>
      </div>

      {/* 6 stat cards in 3-column grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card rounded-2xl border border-border p-5
                       hover:shadow-md transition-shadow duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
                {card.label}
              </p>
              <card.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="font-mono text-2xl font-bold text-foreground">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* LLM Spend progress bar — AC-8 */}
      {stats && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
              Daily LLM Spend
            </p>
            <p className="font-mono text-sm text-foreground">
              ${stats.daily_llm_spend_usd.toFixed(4)} / ${stats.llm_spend_cap_usd.toLocaleString()}
            </p>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (stats.daily_llm_spend_usd / stats.llm_spend_cap_usd) * 100)}%`,
              }}
            />
          </div>
          {stats.daily_llm_spend_usd > stats.llm_spend_cap_usd * 0.9 && (
            <p className="text-xs text-warning font-mono">
              ⚠ Near daily cap — monitor closely
            </p>
          )}
        </div>
      )}
    </div>
  )
}
