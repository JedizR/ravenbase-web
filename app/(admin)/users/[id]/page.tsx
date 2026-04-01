"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { Coins, Ban, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Minus, Plus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApiFetch } from "@/lib/api-client"
import Link from "next/link"

interface CreditTransaction {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
}

interface UserDetail {
  id: string
  email: string
  tier: "free" | "pro" | "team"
  credits_balance: number
  is_active: boolean
  created_at: string
  source_count: number
  transactions: CreditTransaction[]
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [reason, setReason] = useState("")
  const queryClient = useQueryClient()
  const apiFetch = useApiFetch()

  const { data: user, isLoading } = useQuery<UserDetail>({
    queryKey: ["admin", "user", userId],
    queryFn: () => apiFetch<UserDetail>(`/v1/admin/users/${userId}`),
    staleTime: 30_000,
  })

  const adjustMutation = useMutation({
    mutationFn: (payload: { user_id: string; amount: number; reason: string }) =>
      apiFetch("/v1/admin/credits/adjust", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Credits adjusted successfully")
      setAdjustAmount(0)
      setReason("")
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] })
    },
    onError: () => {
      toast.error("Failed to adjust credits. Please try again.")
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (payload: { user_id: string; is_active: boolean }) =>
      apiFetch("/v1/admin/users/toggle-active", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, { is_active }) => {
      toast.success(is_active ? "User enabled" : "User disabled")
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] })
    },
  })

  const tierBadgeClass = (tier: string) => {
    if (tier === "pro") return "bg-primary/10 text-primary"
    if (tier === "team") return "bg-accent/30 text-foreground"
    return "bg-secondary text-muted-foreground"
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-secondary rounded" />
          <div className="h-32 bg-secondary rounded-2xl" />
          <div className="h-64 bg-secondary rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </Link>

      <h1 className="font-serif text-3xl">User Details</h1>

      {/* User info card */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium">{user.email}</p>
            <p className="text-xs text-muted-foreground font-mono">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-mono ${tierBadgeClass(user.tier)}`}>
            {user.tier.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/50 rounded-xl p-4">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-1">CREDITS</p>
            <p className="font-mono text-2xl font-bold">{user.credits_balance.toLocaleString()}</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-1">SOURCES</p>
            <p className="font-mono text-2xl font-bold">{user.source_count}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() =>
              adjustMutation.mutate({
                user_id: user.id,
                amount: adjustAmount,
                reason,
              })
            }
            disabled={adjustAmount === 0 || reason.length < 10}
            className="rounded-full"
          >
            <Coins className="w-4 h-4 mr-2" />
            Adjust Credits
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toggleActiveMutation.mutate({
                user_id: user.id,
                is_active: !user.is_active,
              })
            }
            className={`rounded-full ${!user.is_active ? "text-success border-success" : ""}`}
          >
            {user.is_active ? (
              <>
                <Ban className="w-4 h-4 mr-2" />
                Disable Account
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Enable Account
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Credit adjustment */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ CREDIT_ADJUSTMENT</p>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAdjustAmount((a) => a - 100)}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <input
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
            className="w-24 text-center font-mono text-lg border border-border
                       rounded-xl px-3 py-2 outline-none
                       focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAdjustAmount((a) => a + 100)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reason" className="text-sm font-medium">
            Reason (minimum 10 characters)
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why you are adjusting this user's credits..."
            rows={3}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm
                       outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {reason.length > 0 && reason.length < 10 && (
            <p className="text-xs text-destructive">
              {10 - reason.length} more characters required
            </p>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ TRANSACTION_HISTORY</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-mono text-xs uppercase">Date</TableHead>
              <TableHead className="font-mono text-xs uppercase">Type</TableHead>
              <TableHead className="font-mono text-xs uppercase">Amount</TableHead>
              <TableHead className="font-mono text-xs uppercase">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.transactions && user.transactions.length > 0 ? (
              user.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-secondary">
                      {tx.type}
                    </span>
                  </TableCell>
                  <TableCell className={`font-mono text-sm ${tx.amount >= 0 ? "text-success" : "text-destructive"}`}>
                    {tx.amount >= 0 ? "+" : ""}{tx.amount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tx.description}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                  No transactions yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}