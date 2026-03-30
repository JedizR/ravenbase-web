"use client"
import { AlertCircle } from "lucide-react"
import { CitationCard, type Citation } from "./CitationCard"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
  isStreaming?: boolean
  isError?: boolean
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 space-y-2 ${
          isUser
            ? "bg-secondary text-foreground"
            : message.isError
            ? "bg-destructive/10 border border-destructive/25"
            : "bg-card border border-border"
        }`}
      >
        {/* Error state */}
        {message.isError && (
          <div className="flex items-center gap-2 text-destructive text-sm" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Failed to get response. Try again.
          </div>
        )}

        {/* Content with streaming cursor */}
        <p className="text-sm whitespace-pre-wrap">
          {message.content}
          {message.isStreaming && (
            <span aria-hidden="true" className="animate-pulse">
              ▌
            </span>
          )}
        </p>

        {/* Citations — only show when done (no citations during streaming) */}
        {!message.isStreaming &&
          message.citations &&
          message.citations.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {message.citations.map((c, i) => (
                <CitationCard key={i} citation={c} />
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
