"use client"

import { useState } from "react"
import { useApiFetch } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, X } from "lucide-react"
import { toast } from "sonner"
import type { GraphQueryResponse } from "@/src/lib/api-client/types.gen"

const EXAMPLE_QUERIES = [
  "Show my Python projects",
  "Skills I've learned since 2023",
  "What decisions did I make about databases?",
  "Find memories about machine learning",
]

interface GraphQueryBarProps {
  onResults: (results: GraphQueryResponse | null) => void
  profileId: string | null
}

export function GraphQueryBar({ onResults, profileId }: GraphQueryBarProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const apiFetch = useApiFetch()

  const executeSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const data = await apiFetch<GraphQueryResponse>("/v1/graph/query", {
        method: "POST",
        body: JSON.stringify({ query: q, profile_id: profileId, limit: 20 }),
      })
      onResults(data)
    } catch {
      toast.error("Query failed. Try rephrasing.")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => executeSearch(query)

  const handleClear = () => {
    setQuery("")
    onResults(null)
  }

  return (
    <div className="space-y-2 p-4 bg-card border-b border-border">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch()
          }}
          placeholder="Ask your graph anything..."
          className="font-mono text-sm"
          aria-label="Graph query input"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            aria-label="Clear query"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          aria-label="Search graph"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!query && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => { setQuery(eq); executeSearch(eq) }}
              className="text-xs font-mono text-muted-foreground border border-border
                         rounded px-2 py-0.5 hover:border-primary hover:text-primary transition-colors"
            >
              {eq}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
