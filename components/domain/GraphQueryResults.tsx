"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GraphQueryResponse } from "@/src/lib/api-client/types.gen"

interface GraphQueryResultsProps {
  queryResults: GraphQueryResponse | null
  onResultCardClick: (nodeId: string) => void
}

function MemoryCard({
  node,
  onClick,
}: {
  node: { id: string; label: string; properties: Record<string, unknown> }
  onClick: () => void
}) {
  const content = (node.properties.content as string) ?? node.properties.text as string ?? ""
  const preview = content.length > 150 ? content.slice(0, 150) + "…" : content
  const sourceName = (node.properties.source_name as string) ?? (node.properties.filename as string) ?? "—"
  const confidence = (node.properties.confidence as number) ?? null

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <p className="text-sm text-foreground mb-2 line-clamp-3">{preview || node.label}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="w-3 h-3" />
          <span className="font-mono truncate max-w-[150px]">{sourceName}</span>
        </div>
        {confidence !== null && (
          <Badge
            variant="outline"
            className="bg-warning/10 text-[var(--warning-foreground)] border-warning/25 text-xs"
          >
            {Math.round(confidence * 100)}% match
          </Badge>
        )}
      </div>
    </button>
  )
}

export function GraphQueryResults({ queryResults, onResultCardClick }: GraphQueryResultsProps) {
  const [showCypher, setShowCypher] = useState(false)

  if (!queryResults) return null

  const { results, cypher, explanation, query_time_ms } = queryResults
  const nodes = results.nodes

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground tracking-wider">
            ◆ QUERY_RESULTS
          </span>
          <Badge variant="secondary" className="text-xs">
            {nodes.length} found · {query_time_ms}ms
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{explanation}</p>
      </div>

      {nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No memories found. Try a different question.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {nodes.map((node) => (
            <MemoryCard
              key={node.id}
              node={node}
              onClick={() => onResultCardClick(node.id)}
            />
          ))}
        </div>
      )}

      <Collapsible open={showCypher} onOpenChange={setShowCypher}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {showCypher ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {showCypher ? "Hide Cypher" : "Show Cypher"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="mt-2 p-3 bg-secondary/50 rounded-lg text-xs font-mono text-muted-foreground overflow-x-auto">
            {cypher}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
