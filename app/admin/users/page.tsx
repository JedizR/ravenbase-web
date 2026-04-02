"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, MoreHorizontal, Ban, User, Coins, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Minus, Plus } from "lucide-react"
import { useApiFetch } from "@/lib/api-client"
import Link from "next/link"

interface AdminUserOut {
  id: string
  email: string
  display_name: string | null
  tier: string
  credits_balance: number
  is_active: boolean
  created_at: string
  last_active_at: string | null
}

interface AdminUserListResponse {
  users: AdminUserOut[]
  total: number
  page: number
}

type TierFilter = "All" | "Free" | "Pro" | "Team"
type StatusFilter = "All" | "Active" | "Disabled"

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<TierFilter>("All")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [page, setPage] = useState(1)
  const [creditDialogUser, setCreditDialogUser] = useState<AdminUserOut | null>(null)
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [reason, setReason] = useState("")
  const queryClient = useQueryClient()
  const apiFetch = useApiFetch()

  const { data: resp, isLoading } = useQuery<AdminUserListResponse>({
    queryKey: ["admin", "users", search, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("q", search)
      params.set("page", String(page))
      params.set("page_size", String(PAGE_SIZE))
      return apiFetch<AdminUserListResponse>(`/v1/admin/users?${params}`)
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  // Client-side tier/status filtering on the current page
  const allUsers = resp?.users ?? []
  const users = allUsers.filter((u) => {
    const matchesTier = tierFilter === "All" || u.tier === tierFilter.toLowerCase()
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && u.is_active) ||
      (statusFilter === "Disabled" && !u.is_active)
    return matchesTier && matchesStatus
  })

  const total = resp?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const adjustMutation = useMutation({
    mutationFn: (payload: { user_id: string; amount: number; reason: string }) =>
      apiFetch<{ new_balance: number }>("/v1/admin/credits/adjust", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      toast.success(`Credits adjusted. New balance: ${data.new_balance.toLocaleString()}`)
      setCreditDialogUser(null)
      setAdjustAmount(0)
      setReason("")
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: () => toast.error("Failed to adjust credits. Please try again."),
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
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: () => toast.error("Failed to update user status."),
  })

  const tierBadgeClass = (tier: string) => {
    if (tier === "pro") return "bg-primary/10 text-primary"
    if (tier === "team") return "bg-accent/30 text-foreground"
    return "bg-secondary text-muted-foreground"
  }

  const pillClass = (active: boolean) =>
    active
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-muted-foreground hover:bg-secondary/80"

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total.toLocaleString()} total users
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by email..."
            className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground
                       outline-none border border-border placeholder:text-muted-foreground
                       focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {/* Tier filter pills */}
        <div className="flex gap-1.5">
          {(["All", "Free", "Pro", "Team"] as TierFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTierFilter(t); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors min-h-11 ${pillClass(tierFilter === t)}`}
            >
              {t}
            </button>
          ))}
        </div>
        {/* Status filter pills */}
        <div className="flex gap-1.5">
          {(["All", "Active", "Disabled"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors min-h-11 ${pillClass(statusFilter === s)}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* User table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="font-mono text-xs uppercase pl-5">User</TableHead>
              <TableHead className="font-mono text-xs uppercase">Tier</TableHead>
              <TableHead className="font-mono text-xs uppercase">Credits</TableHead>
              <TableHead className="font-mono text-xs uppercase">Status</TableHead>
              <TableHead className="font-mono text-xs uppercase">Joined</TableHead>
              <TableHead className="w-12 pr-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-5"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              : users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell className="pl-5">
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-secondary">
                            {user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground hover:text-primary">
                          {user.email}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${tierBadgeClass(user.tier)}`}>
                        {user.tier.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      {user.credits_balance.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                        user.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}>
                        {user.is_active ? "ACTIVE" : "DISABLED"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="pr-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl min-w-45">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`} className="flex items-center">
                              <User className="w-4 h-4 mr-2" /> View details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCreditDialogUser(user)}>
                            <Coins className="w-4 h-4 mr-2" /> Adjust credits
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              toggleActiveMutation.mutate({ userId: user.id, active: !user.is_active })
                            }
                            className={user.is_active ? "text-destructive focus:text-destructive" : "text-success focus:text-success"}
                          >
                            {user.is_active ? (
                              <><Ban className="w-4 h-4 mr-2" /> Disable account</>
                            ) : (
                              <><CheckCircle className="w-4 h-4 mr-2" /> Enable account</>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <p className="text-xs font-mono text-muted-foreground">
              Page {page} of {totalPages} — {total.toLocaleString()} total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="icon" className="w-8 h-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline" size="icon" className="w-8 h-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Credit Adjustment Dialog */}
      <Dialog
        open={!!creditDialogUser}
        onOpenChange={(o) => {
          if (!o) { setCreditDialogUser(null); setAdjustAmount(0); setReason("") }
        }}
      >
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription className="text-xs font-mono text-muted-foreground">
              {creditDialogUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-secondary/50 rounded-xl px-4 py-3 text-center">
            <p className="text-xs font-mono text-muted-foreground mb-1">Current Balance</p>
            <p className="font-mono text-2xl font-bold text-foreground">
              {creditDialogUser?.credits_balance.toLocaleString()}
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
                {((creditDialogUser?.credits_balance ?? 0) + adjustAmount).toLocaleString()}
              </span>
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="adjust-reason-list" className="text-sm font-medium text-foreground">
              Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              id="adjust-reason-list"
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
            <Button variant="outline" className="rounded-full"
              onClick={() => { setCreditDialogUser(null); setAdjustAmount(0); setReason("") }}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                creditDialogUser &&
                adjustMutation.mutate({ user_id: creditDialogUser.id, amount: adjustAmount, reason })
              }
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
