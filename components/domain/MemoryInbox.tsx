"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useKeyboardInbox } from "@/hooks/use-keyboard-inbox"
import { ConflictCard } from "./ConflictCard"
import { ShortcutOverlay } from "./ShortcutOverlay"
import { InboxEmptyState } from "./InboxEmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  listConflictsV1ConflictsGet,
  resolveConflictV1ConflictsConflictIdResolvePost,
  undoResolutionV1ConflictsConflictIdUndoPost,
} from "@/src/lib/api-client/services.gen"
import type {
  ConflictResponse,
  PaginatedResponse_ConflictResponse_,
} from "@/src/lib/api-client/types.gen"

type InboxMode = "triage" | "chat" | "help"
type InboxAction = "next" | "prev" | "accept" | "reject" | "chat" | "help"

export function MemoryInbox() {
  const queryClient = useQueryClient()
  const [activeIndex, setActiveIndex] = useState(0)
  const [mode, setMode] = useState<InboxMode>("triage")

  // ── TanStack Query: fetch pending conflicts ──────────────────────────
  const {
    data: conflictData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["conflicts", "pending"],
    queryFn: () =>
      listConflictsV1ConflictsGet({ status: "pending", pageSize: 50 }),
    staleTime: 30_000,
  })

  const conflicts: ConflictResponse[] = conflictData?.items ?? []
  const activeConflict = conflicts[activeIndex] ?? null

  // ── Resolve mutation — optimistic update with rollback (FIX 1) ───────
  const resolveMutation = useMutation({
    mutationFn: ({
      conflictId,
      action,
      customText,
    }: {
      conflictId: string
      action: "ACCEPT_NEW" | "KEEP_OLD" | "CUSTOM"
      customText?: string
    }) =>
      resolveConflictV1ConflictsConflictIdResolvePost({
        conflictId,
        requestBody: { action, custom_text: customText ?? null },
      }),
    onMutate: async ({ conflictId }) => {
      await queryClient.cancelQueries({ queryKey: ["conflicts", "pending"] })
      const previous = queryClient.getQueryData([
        "conflicts",
        "pending",
      ]) as PaginatedResponse_ConflictResponse_ | undefined

      // Optimistically remove the conflict from the list
      queryClient.setQueryData(
        ["conflicts", "pending"],
        (old: PaginatedResponse_ConflictResponse_ | undefined) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.filter((c) => c.id !== conflictId),
          }
        }
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previous) {
        queryClient.setQueryData(["conflicts", "pending"], context.previous)
      }
      toast.error("Failed to resolve conflict. Please try again.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conflicts", "pending"] })
    },
  })

  // ── Undo mutation — optimistic update with rollback ───────────────────
  const undoMutation = useMutation({
    mutationFn: ({ conflictId }: { conflictId: string }) =>
      undoResolutionV1ConflictsConflictIdUndoPost({ conflictId }),
    onMutate: async ({ conflictId }) => {
      await queryClient.cancelQueries({ queryKey: ["conflicts", "pending"] })
      const previous = queryClient.getQueryData([
        "conflicts",
        "pending",
      ]) as PaginatedResponse_ConflictResponse_ | undefined

      // Optimistically remove
      queryClient.setQueryData(
        ["conflicts", "pending"],
        (old: PaginatedResponse_ConflictResponse_ | undefined) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.filter((c) => c.id !== conflictId),
          }
        }
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["conflicts", "pending"], context.previous)
      }
      toast.error("Failed to undo. Please try again.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conflicts", "pending"] })
    },
  })

  // ── Keyboard handler ────────────────────────────────────────────────
  const handleAction = useCallback(
    (action: InboxAction) => {
      if (isLoading || conflicts.length === 0) return

      switch (action) {
        case "next":
          setActiveIndex((i) => Math.min(i + 1, conflicts.length - 1))
          break
        case "prev":
          setActiveIndex((i) => Math.max(i - 1, 0))
          break
        case "accept":
          if (mode !== "triage" || !activeConflict) return
          resolveMutation.mutate({
            conflictId: activeConflict.id,
            action: "ACCEPT_NEW",
          })
          // Advance to next after brief animation delay
          setTimeout(() => {
            setActiveIndex((i) => Math.min(i, conflicts.length - 2))
          }, 150)
          break
        case "reject":
          if (mode !== "triage" || !activeConflict) return
          resolveMutation.mutate({
            conflictId: activeConflict.id,
            action: "KEEP_OLD",
          })
          setTimeout(() => {
            setActiveIndex((i) => Math.min(i, conflicts.length - 2))
          }, 150)
          break
        case "chat":
          if (mode === "triage") {
            setMode("chat")
          } else if (mode === "chat") {
            setMode("triage")
          }
          break
        case "help":
          setMode((m) => (m === "help" ? "triage" : "help"))
          break
      }
    },
    [mode, activeConflict, conflicts.length, resolveMutation, isLoading]
  )

  useKeyboardInbox({
    onAction: handleAction,
    enabled: true,
  })

  // ── Chat submit (Flow 2: CUSTOM resolution) ─────────────────────────
  const handleChatSubmit = useCallback(
    (text: string) => {
      if (!activeConflict) return
      resolveMutation.mutate({
        conflictId: activeConflict.id,
        action: "CUSTOM",
        customText: text,
      })
      setMode("triage")
      setTimeout(() => {
        setActiveIndex((i) => Math.min(i, conflicts.length - 2))
      }, 150)
    },
    [activeConflict, conflicts.length, resolveMutation]
  )

  // ── Loading state ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          ◆ FETCH_ERROR
        </span>
        <p className="text-sm text-muted-foreground">
          Could not load conflicts. Check your connection.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  // ── Empty state (AC-7) ───────────────────────────────────────────────
  if (conflicts.length === 0) {
    return <InboxEmptyState />
  }

  // ── Main inbox ──────────────────────────────────────────────────────
  const isSubmitting = resolveMutation.isPending || undoMutation.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          ◆ MEMORY_INBOX
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          {activeIndex + 1} / {conflicts.length}
        </span>
      </div>

      {/* Conflict cards */}
      <div className="space-y-4">
        {conflicts.map((conflict, i) => (
          <div
            key={conflict.id}
            onTouchStart={(e) => {
              // Mobile swipe detection (AC-12: progressive enhancement)
              const startX = e.touches[0].clientX
              const endHandler = (ev: TouchEvent) => {
                const delta = ev.changedTouches[0].clientX - startX
                if (delta > 80) handleAction("accept")
                if (delta < -80) handleAction("reject")
                window.removeEventListener("touchend", endHandler)
              }
              window.addEventListener("touchend", endHandler)
            }}
          >
            <ConflictCard
              conflict={conflict}
              isActive={i === activeIndex}
              mode={mode === "chat" && i === activeIndex ? "chat" : "triage"}
              isPending={isSubmitting}
              isSubmitting={isSubmitting && i === activeIndex}
              onAccept={() => handleAction("accept")}
              onReject={() => handleAction("reject")}
              onEnterChat={() => handleAction("chat")}
              onChatSubmit={handleChatSubmit}
              onCancelChat={() => setMode("triage")}
            />
          </div>
        ))}
      </div>

      {/* Shortcut overlay (AC-10: shown on ? key) */}
      <ShortcutOverlay
        isOpen={mode === "help"}
        onClose={() => setMode("triage")}
      />
    </div>
  )
}
