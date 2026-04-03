"use client"
import { useState } from "react"
import { AlertCircle, Check, Copy } from "lucide-react"
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
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[80%] rounded-2xl px-4 py-3 space-y-2 ${
          isUser
            ? "bg-secondary text-foreground"
            : message.isError
            ? "bg-destructive/10 border border-destructive/25"
            : "bg-card border border-border"
        }`}
      >
        {/* Error state — show actual error from message.content */}
        {message.isError && (
          <div className="flex items-start gap-2 text-destructive text-sm" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message.content || "Failed to get response. Try again."}</span>
          </div>
        )}

        {/* Content with streaming cursor — hide when error (shown above) */}
        {!message.isError && (
          <p className="text-sm whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span aria-hidden="true" className="animate-pulse">
                ▌
              </span>
            )}
          </p>
        )}

        {/* Copy button — assistant messages only, on hover */}
        {!isUser && !message.isStreaming && !message.isError && message.content && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 border border-border/50 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={copied ? "Copied" : "Copy message"}
          >
            {copied ? (
              <Check className="w-3 h-3 text-success" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        )}

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
