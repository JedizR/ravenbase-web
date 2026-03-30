"use client"
import { Trash2 } from "lucide-react"
import type { ChatSessionSummary } from "@/src/lib/api-client/types.gen"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface ChatSessionSidebarProps {
  sessions: ChatSessionSummary[]
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  isLoading: boolean
  className?: string
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: ChatSessionSummary
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const title = session.title ?? "New conversation"
  const shortTitle = title.length > 60 ? title.slice(0, 60) + "..." : title

  return (
    <div className="group relative">
      <button
        onClick={onSelect}
        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors min-h-[44px] ${
          isActive
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-secondary"
        }`}
      >
        <div className="flex items-start justify-between gap-2 pr-6">
          <span className="flex-1 truncate font-medium">{shortTitle}</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono mt-0.5">
          {new Date(session.updated_at).toLocaleDateString()}
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground
                   hover:text-destructive opacity-0 group-hover:opacity-100
                   transition-opacity p-1.5 rounded-md hover:bg-destructive/10"
        aria-label="Delete session"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ChatSessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  isLoading,
  className = "",
}: ChatSessionSidebarProps) {
  return (
    <div
      className={`${className} p-4 space-y-3 bg-background`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          ◆ SESSIONS
        </span>
      </div>

      {isLoading ? (
        [...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))
      ) : sessions.length === 0 ? (
        <p className="text-xs text-muted-foreground px-3">
          No sessions yet.
        </p>
      ) : (
        sessions.map((s) => (
          <SessionItem
            key={s.id}
            session={s}
            isActive={s.id === activeSessionId}
            onSelect={() => onSelectSession(s.id)}
            onDelete={() => onDeleteSession(s.id)}
          />
        ))
      )}
    </div>
  )
}
