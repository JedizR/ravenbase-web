"use client"

import { Check, RotateCcw, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import type { ConflictResponse } from "@/src/lib/api-client/types.gen"
import { ConflictChat } from "./ConflictChat"

interface ConflictCardProps {
  conflict: ConflictResponse
  isActive: boolean
  mode: "triage" | "chat"
  isPending?: boolean
  isSubmitting?: boolean
  onAccept: () => void
  onReject: () => void
  onEnterChat: () => void
  onChatSubmit: (text: string) => void
  onCancelChat: () => void
}

export function ConflictCard({
  conflict,
  isActive,
  mode,
  isPending = false,
  isSubmitting = false,
  onAccept,
  onReject,
  onEnterChat,
  onChatSubmit,
  onCancelChat,
}: ConflictCardProps) {
  const cardClass = isActive
    ? "border-2 border-primary"
    : "border border-border opacity-70"

  const confidence = Math.round(conflict.confidence_score * 100)

  return (
    <div
      className={`bg-card ${cardClass} rounded-2xl p-4 space-y-4 transition-all duration-150 ${
        isActive ? "shadow-md" : ""
      }`}
      aria-label={`Conflict: ${conflict.incumbent_content.slice(0, 30)}...`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          ◆ MEMORY_CONFLICT
        </span>
        <Badge className="bg-warning text-[var(--warning-foreground)] text-xs">
          {confidence}% confidence
        </Badge>
      </div>

      {/* OLD memory */}
      <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
        <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-muted-foreground mb-1">OLD</p>
          <p className="text-sm">{conflict.incumbent_content}</p>
        </div>
      </div>

      {/* NEW memory */}
      <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-muted-foreground mb-1">NEW</p>
          <p className="text-sm">{conflict.challenger_content}</p>
        </div>
      </div>

      {/* AI suggestion */}
      {conflict.ai_proposed_resolution && (
        <div className="p-3 bg-accent/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              AI_SUGGESTION
            </span>
          </div>
          <p className="text-sm">{conflict.ai_proposed_resolution}</p>
        </div>
      )}

      <Separator />

      {/* Source attribution */}
      <p className="text-xs font-mono text-muted-foreground">
        from: {conflict.incumbent_source_id ?? "unknown"} →{" "}
        {conflict.challenger_source_id ?? "unknown"}
      </p>

      {/* Chat mode — replace action buttons with chat */}
      {mode === "chat" && isActive ? (
        <ConflictChat
          conflict={conflict}
          isSubmitting={isSubmitting}
          onSubmit={onChatSubmit}
          onCancel={onCancelChat}
        />
      ) : (
        <>
          {/* Action buttons — triage mode */}
          <div className="space-y-3">
            {/* Desktop: inline buttons; Mobile: stacked */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                className="flex-1 h-11 sm:h-8 bg-primary text-primary-foreground rounded-full disabled:opacity-50"
                onClick={onAccept}
                disabled={isPending || isSubmitting}
                aria-label="Accept new memory (Enter)"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Check className="w-3 h-3 mr-1" />
                )}
                Accept New
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-11 sm:h-8 rounded-full disabled:opacity-50"
                onClick={onReject}
                disabled={isPending || isSubmitting}
                aria-label="Keep old memory (Backspace)"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3 mr-1" />
                )}
                Keep Old
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-11 sm:h-8 rounded-full disabled:opacity-50"
                onClick={onEnterChat}
                disabled={isPending || isSubmitting}
                aria-label="Open chat (C)"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Discuss
              </Button>
            </div>

            {/* Keyboard hints — desktop only (AC-11) */}
            <div className="hidden md:flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Kbd className="text-xs">Enter</Kbd>
              <span>Accept</span>
              <span className="mx-1">·</span>
              <Kbd className="text-xs">⌫ Backspace</Kbd>
              <span>Keep</span>
              <span className="mx-1">·</span>
              <Kbd className="text-xs">C</Kbd>
              <span>Chat</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
