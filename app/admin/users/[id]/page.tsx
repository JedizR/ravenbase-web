"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { Coins, Ban, CheckCircle, ArrowLeft, CreditCard, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useApiFetch } from "@/lib/api-client"
import Link from "next/link"

interface AdminTransactionOut {
  id: number
  amount: number
  balance_after: number
  operation: string
  created_at: string
}

interface AdminUserDetailResponse {
  id: string
  email: string
  display_name: string | null
  tier: string
  credits_balance: number
  is_active: boolean
  created_at: string
  last_active_at: string | null
  referral_code: string
  recent_transactions: AdminTransactionOut[]
  source_count: number
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const queryClient = useQueryClient()
  const apiFetch = useApiFetch()

  const [creditDialogOpen, setCreditDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [reason, setReason] = useState("")

  const { data: user, isLoading } = useQuery<AdminUserDetailResponse>({
    queryKey: ["admin", "user", userId],
    queryFn: () => apiFetch<AdminUserDetailResponse>(`/v1/admin/users/${userId}`),
    staleTime: 30_000,
  })

  const adjustMutation = useMutation({
    mutationFn: (payload: { user_id: string; amount: number; reason: string }) =>
      apiFetch<{ new_balance: number }>("/v1/admin/credits/adjust", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      toast.success(`Credits adjusted. New balance: ${data.new_balance.toLocaleString()}`)
      setCreditDialogOpen(false)
      setAdjustAmount(0)
      setReason("")
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] })
    },
    onError: () => toast.error("Failed to adjust credits."),
  })

  const toggleActiveMutation = useMutation({
    // POST /v1/admin/users/{user_id}/toggle-active with body { active: boolean }
    mutationFn: (payload: { userId: string; active: boolean }) =>
      apiFetch(`/v1/admin/users/${payload.userId}/toggle-active`, {
        method: "POST",
        body: JSON.stringify({ active: payload.active }),
      }),
    onSuccess: (_, { active }) => {
      toast.success(active ? "User enabled" : "User disabled")
      setBanDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: () => toast.error("Failed to update user status."),
  })

  const tierBadgeClass = (tier: string) => {
    if (tier === "pro") return "bg-primary/10 text-primary"
    if (tier === "team") return "bg-accent/30 text-foreground"
    return "bg-secondary text-muted-foreground"
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl">
        <Skeleton className="h-5 w-24" />
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-destructive font-mono text-sm">User not found.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                   hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Users
      </Link>

      {/* User info card */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl text-foreground">{user.email}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${tierBadgeClass(user.tier)}`}>
                {user.tier.toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                user.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}>
                {user.is_active ? "ACTIVE" : "DISABLED"}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setBanDialogOpen(true)}
            className={`rounded-full min-h-11 px-4 ${
              user.is_active
                ? "border-destructive text-destructive hover:bg-destructive/10"
                : "border-success text-success hover:bg-success/10"
            }`}
          >
            {user.is_active ? (
              <><Ban className="w-4 h-4 mr-1.5" /> Disable Account</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-1.5" /> Enable Account</>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase mb-1">Credits</p>
            <p className="font-mono text-xl font-bold text-foreground">
              {user.credits_balance.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase mb-1">Sources</p>
            <p className="font-mono text-xl font-bold text-foreground">
              {user.source_count.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase mb-1">Joined</p>
            <p className="font-mono text-sm font-bold text-foreground">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="outline" onClick={() => setCreditDialogOpen(true)} className="rounded-full">
            <Coins className="w-4 h-4 mr-1.5" />
            Adjust Credits
          </Button>
        </div>
      </div>

      {/* Credit Transaction History */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium text-foreground">Credit History</h2>
          <span className="text-xs font-mono text-muted-foreground ml-auto">Last 20 transactions</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-mono text-xs uppercase">Operation</TableHead>
              <TableHead className="font-mono text-xs uppercase text-right">Amount</TableHead>
              <TableHead className="font-mono text-xs uppercase text-right">Balance After</TableHead>
              <TableHead className="font-mono text-xs uppercase">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.recent_transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                  No credit transactions yet
                </TableCell>
              </TableRow>
            ) : (
              user.recent_transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-secondary/20">
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-secondary text-muted-foreground">
                      {tx.operation.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm ${
                    tx.amount > 0 ? "text-success" : "text-destructive"
                  }`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-foreground">
                    {tx.balance_after.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Ban/Unban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{user.is_active ? "Disable Account?" : "Enable Account?"}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {user.is_active
                ? `This will prevent ${user.email} from logging in. This can be reversed.`
                : `This will allow ${user.email} to log in again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBanDialogOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={() => toggleActiveMutation.mutate({ userId: user.id, active: !user.is_active })}
              className={`rounded-full ${
                user.is_active
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-success text-success-foreground hover:bg-success/90"
              }`}
            >
              {user.is_active ? "Disable Account" : "Enable Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Adjustment Dialog */}
      <Dialog
        open={creditDialogOpen}
        onOpenChange={(o) => { if (!o) { setCreditDialogOpen(false); setAdjustAmount(0); setReason("") } }}
      >
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription className="text-xs font-mono text-muted-foreground">
              {user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-secondary/50 rounded-xl px-4 py-3 text-center">
            <p className="text-xs font-mono text-muted-foreground mb-1">Current Balance</p>
            <p className="font-mono text-2xl font-bold text-foreground">
              {user.credits_balance.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" className="w-10 h-10 rounded-full"
              onClick={() => setAdjustAmount((a) => a - 100)}>
              <Minus className="w-4 h-4" />
            </Button>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
              className="w-28 text-center font-mono text-2xl font-bold border border-border
                         rounded-xl px-3 py-2 outline-none bg-card
                         focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <Button variant="outline" size="icon" className="w-10 h-10 rounded-full"
              onClick={() => setAdjustAmount((a) => a + 100)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {adjustAmount !== 0 && (
            <p className="text-center text-xs font-mono text-muted-foreground">
              New balance:{" "}
              <span className={adjustAmount > 0 ? "text-success" : "text-destructive"}>
                {(user.credits_balance + adjustAmount).toLocaleString()}
              </span>
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="detail-reason" className="text-sm font-medium text-foreground">
              Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              id="detail-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why you are adjusting credits (min 10 characters)..."
              rows={3}
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm
                         outline-none bg-card resize-none
                         focus:ring-2 focus:ring-primary/30 focus:border-primary
                         placeholder:text-muted-foreground"
            />
            {reason.length > 0 && reason.length < 10 && (
              <p className="text-xs text-destructive">{10 - reason.length} more characters required</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreditDialogOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={() => adjustMutation.mutate({ user_id: user.id, amount: adjustAmount, reason })}
              disabled={adjustAmount === 0 || reason.length < 10}
              className="rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              {adjustAmount > 0
                ? `Add ${adjustAmount} credits`
                : adjustAmount < 0
                ? `Remove ${Math.abs(adjustAmount)} credits`
                : "Set amount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
