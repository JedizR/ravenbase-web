"use client"
import { useState } from "react"

import { MetaDocEditor } from "@/components/domain/MetaDocEditor"
import { MetaDocHistory } from "@/components/domain/MetaDocHistory"
import type { MetaDocSummary } from "@/src/lib/api-client/types.gen"

export function Workstation() {
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [activeContent, setActiveContent] = useState("")
  const [activePrompt, setActivePrompt] = useState("")
  const [historyMobileOpen, setHistoryMobileOpen] = useState(false)

  const handleSelectDoc = (doc: MetaDocSummary) => {
    setActiveDocId(doc.id)
    setActivePrompt(doc.original_prompt)
    // Content will be loaded from localStorage or fetched
    setActiveContent("")
    setHistoryMobileOpen(false)
  }

  const handleStreamingEnd = (content: string, docId: string | null) => {
    if (docId && content) {
      // Persist to localStorage
      try {
        const key = `ravenbase:workstation:doc:${docId}`
        localStorage.setItem(key, content)
      } catch {
        // localStorage unavailable
      }
    }
  }

  return (
    <div className="flex h-full">
      {/* History panel */}
      <MetaDocHistory
        activeDocId={activeDocId}
        onSelectDoc={handleSelectDoc}
        mobileOpen={historyMobileOpen}
        onMobileOpenChange={setHistoryMobileOpen}
      />

      {/* Editor */}
      <main className="flex-1 flex flex-col min-w-0">
        <MetaDocEditor
          initialContent={activeContent}
          initialPrompt={activePrompt}
          initialDocId={activeDocId}
          onStreamingEnd={handleStreamingEnd}
        />
      </main>
    </div>
  )
}
