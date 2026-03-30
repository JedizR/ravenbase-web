"use client"

import { useRouter } from "next/navigation"
import { RavenbaseLogo } from "@/components/brand/RavenbaseLogo"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface GraphEmptyStateProps {
  isProcessing: boolean
  hasSources: boolean
  onClearFilters?: () => void
}

export function GraphEmptyState({
  isProcessing,
  hasSources,
  onClearFilters,
}: GraphEmptyStateProps) {
  const router = useRouter()

  // State 1: Job is actively processing
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] rounded-2xl border border-border bg-card">
        <RavenbaseLogo size="lg" className="opacity-20 animate-pulse" />
        <p className="mt-4 font-mono text-sm text-muted-foreground tracking-wider">
          ◆ PROCESSING
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Processing your sources...
        </p>
      </div>
    )
  }

  // State 2: No sources at all
  if (!hasSources) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] rounded-2xl border border-border bg-card">
        <RavenbaseLogo size="lg" className="opacity-40" />
        <p className="mt-4 font-mono text-sm text-muted-foreground tracking-wider">
          ◆ KNOWLEDGE_GRAPH
        </p>
        <h2 className="mt-2 text-xl font-serif font-medium text-foreground">
          Your knowledge graph is empty
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload files to get started.
        </p>
        <Button
          className="mt-6 rounded-full"
          onClick={() => router.push("/sources")}
        >
          <Upload className="size-4" />
          Upload Files
        </Button>
      </div>
    )
  }

  // State 3: Has sources but no matching nodes (filters applied)
  return (
    <div className="flex flex-col items-center justify-center h-[600px] rounded-2xl border border-border bg-card">
      <RavenbaseLogo size="lg" className="opacity-40" />
      <p className="mt-4 font-mono text-sm text-muted-foreground tracking-wider">
        ◆ KNOWLEDGE_GRAPH
      </p>
      <h2 className="mt-2 text-xl font-serif font-medium text-foreground">
        No matching nodes
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Try adjusting your filters.
      </p>
      {onClearFilters && (
        <Button
          className="mt-6 rounded-full"
          variant="outline"
          onClick={onClearFilters}
        >
          Clear Filters
        </Button>
      )}
    </div>
  )
}
