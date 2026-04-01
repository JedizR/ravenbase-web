"use client"
import { useQuery } from "@tanstack/react-query"
import { Users, Zap, CreditCard, DollarSign } from "lucide-react"
import { useApiFetch } from "@/lib/api-client"

interface Stats {
  total_users: number
  active_this_week: number
  total_credits_used: number
  revenue_this_month: number
  daily_llm_spend: number
  daily_llm_spend_cap: number
}

export default function AdminDashboardPage() {
  const apiFetch = useApiFetch()

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch<Stats>("/v1/admin/stats"),
    staleTime: 30_000,
  })

  const statCards = [
    {
      label: "Total Users",
      value: stats?.total_users ?? 0,
      icon: Users,
      trend: null,
    },
    {
      label: "Active This Week",
      value: stats?.active_this_week ?? 0,
      icon: Zap,
      trend: null,
    },
    {
      label: "Total Credits Used",
      value: stats?.total_credits_used ?? 0,
      icon: CreditCard,
      trend: null,
    },
    {
      label: "Revenue This Month",
      value: stats?.revenue_this_month ?? 0,
      icon: DollarSign,
      trend: null,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-serif text-3xl">Admin Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card rounded-2xl border border-border p-6
                       hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
                {card.label}
              </p>
              <card.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="font-mono text-3xl font-bold text-foreground">
              {isLoading ? "—" : card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* LLM Spend progress bar */}
      {stats && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
              Daily LLM Spend
            </p>
            <p className="font-mono text-sm">
              ${stats.daily_llm_spend} / ${stats.daily_llm_spend_cap.toLocaleString()}
            </p>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (stats.daily_llm_spend / stats.daily_llm_spend_cap) * 100)}%`,
              }}
            />
          </div>
          {stats.daily_llm_spend > stats.daily_llm_spend_cap * 0.9 && (
            <p className="text-xs text-warning font-mono">
              ⚠ Near daily cap — monitor closely
            </p>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <a
          href="/admin/users"
          className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium"
        >
          Manage Users →
        </a>
      </div>
    </div>
  )
}