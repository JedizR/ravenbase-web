"use client"
import { useRouter } from "next/navigation"

export interface Citation {
  memory_id: string | null
  content_preview: string
  source_id: string
}

interface CitationCardProps {
  citation: Citation
}

export function CitationCard({ citation }: CitationCardProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => {
        if (citation.memory_id) {
          router.push(`/graph?node=${citation.memory_id}`)
        }
      }}
      className="text-xs font-mono text-muted-foreground border border-border rounded px-2 py-0.5
                 hover:border-primary hover:text-primary transition-colors"
      aria-label={`View source: ${citation.source_id}`}
    >
      ↗ {citation.source_id}
    </button>
  )
}
