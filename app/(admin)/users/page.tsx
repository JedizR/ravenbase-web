"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, MoreHorizontal, Ban, User, Coins } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { useApiFetch } from "@/lib/api-client"
import { useRouter } from "next/navigation"

interface UserType {
  id: string
  email: string
  tier: "free" | "pro" | "team"
  credits_balance: number
  is_active: boolean
  created_at: string
}

type TierFilter = "All" | "Free" | "Pro" | "Team"

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<TierFilter>("All")
  const [creditDialogUser, setCreditDialogUser] = useState<UserType | null>(null)
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [reason, setReason] = useState("")
  const queryClient = useQueryClient()
  const apiFetch = useApiFetch()
  const router = useRouter()

  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["admin", "users"],
    queryFn: () => apiFetch<UserType[]>("/v1/admin/users"),
    staleTime: 30_000,
  })

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase())
    const matchesTier = tierFilter === "All" || u.tier === tierFilter.toLowerCase()
    return matchesSearch && matchesTier
  })

  const adjustMutation = useMutation({
    mutationFn: (payload: { user_id: string; amount: number; reason: string }) =>
      apiFetch("/v1/admin/credits/adjust", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success(`Credits adjusted for ${creditDialogUser?.email}`)
      setCreditDialogUser(null)
      setAdjustAmount(0)
      setReason("")
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
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
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })

  const tierBadgeClass = (tier: string) => {
    if (tier === "pro") return "bg-primary/10 text-primary"
    if (tier === "team") return "bg-accent/30 text-foreground"
    return "bg-secondary text-muted-foreground"
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-serif text-3xl">User Management</h1>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2
                       text-sm outline-none border border-border
                       focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {/* Tier filter pills */}
        <div className="flex gap-2">
          {(["All", "Free", "Pro", "Team"] as TierFilter[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-mono transition-colors
                ${tierFilter === tier
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }
              `}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* User table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-mono text-xs uppercase w-[240px]">User</TableHead>
              <TableHead className="font-mono text-xs uppercase">Tier</TableHead>
              <TableHead className="font-mono text-xs uppercase">Credits</TableHead>
              <TableHead className="font-mono text-xs uppercase">Status</TableHead>
              <TableHead className="font-mono text-xs uppercase">Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-secondary/30 cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-secondary">
                        {user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${tierBadgeClass(user.tier)}`}>
                    {user.tier.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">{user.credits_balance.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-mono
                    ${user.is_active
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                    }
                  `}>
                    {user.is_active ? "ACTIVE" : "DISABLED"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                        <User className="w-4 h-4 mr-2" /> View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCreditDialogUser(user)}>
                        <Coins className="w-4 h-4 mr-2" /> Adjust credits
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            user_id: user.id,
                            is_active: !user.is_active,
                          })
                        }
                        className={!user.is_active ? "text-success" : ""}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        {user.is_active ? "Disable account" : "Enable account"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Credit Adjustment Dialog */}
      <Dialog open={!!creditDialogUser} onOpenChange={(o) => !o && setCreditDialogUser(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Credits — {creditDialogUser?.email}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreditDialogUser(null)
                setAdjustAmount(0)
                setReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                creditDialogUser &&
                adjustMutation.mutate({
                  user_id: creditDialogUser.id,
                  amount: adjustAmount,
                  reason,
                })
              }
              disabled={adjustAmount === 0 || reason.length < 10}
              className="rounded-full bg-primary"
            >
              {adjustAmount > 0
                ? `Add ${adjustAmount}`
                : adjustAmount < 0
                ? `Remove ${Math.abs(adjustAmount)}`
                : "Set amount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}