"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import type { ConflictResponse } from "@/src/lib/api-client/types.gen"

interface ConflictChatProps {
  conflict: ConflictResponse
  isSubmitting: boolean
  onSubmit: (text: string) => void
  onCancel: () => void
}

export function ConflictChat({
  conflict,
  isSubmitting,
  onSubmit,
  onCancel,
}: ConflictChatProps) {
  const [chatText, setChatText] = useState("")

  const handleSubmit = () => {
    if (!chatText.trim() || isSubmitting) return
    onSubmit(chatText.trim())
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* AI prompt */}
      <div className="p-3 bg-accent/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-muted-foreground">AI_QUESTION</span>
        </div>
        <p className="text-sm italic text-muted-foreground">
          Both sources seem credible. Can you clarify how these facts relate?
        </p>
      </div>

      {/* Input — NO <form> tag, controlled input + onClick */}
      <Textarea
        value={chatText}
        onChange={(e) => setChatText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
          if (e.key === "Escape") {
            e.preventDefault()
            onCancel()
          }
        }}
        placeholder="Describe how to resolve this conflict..."
        className="min-h-[80px] resize-none"
        maxLength={1000}
        disabled={isSubmitting}
        aria-label="Custom resolution text"
      />

      {/* Footer */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground font-mono">
          {chatText.length}/1000
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!chatText.trim() || isSubmitting}
            className="rounded-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Resolving...
              </>
            ) : (
              "Resolve"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
