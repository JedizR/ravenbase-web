"use client"

import { useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useProfile } from "@/contexts/ProfileContext"
import { useApiFetch } from "@/lib/api-client"
import { AlertCircle, RefreshCw } from "lucide-react"
import { GraphFilters } from "@/components/domain/GraphFilters"
import { GraphNodePanel } from "@/components/domain/GraphNodePanel"
import { GraphEmptyState } from "@/components/domain/GraphEmptyState"
import { ConceptList } from "@/components/domain/ConceptList"
import { GraphQueryBar } from "@/components/domain/GraphQueryBar"
import { GraphQueryResults } from "@/components/domain/GraphQueryResults"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { GraphResponse, GraphQueryResponse } from "@/src/lib/api-client/types.gen"

const GraphExplorer = dynamic(
  () => import("@/components/domain/GraphExplorer").then((mod) => mod.GraphExplorer),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[600px] rounded-2xl" />,
  }
)

const NODE_TYPES = ["concept", "memory", "source", "conflict"] as const
type NodeType = (typeof NODE_TYPES)[number]

export function GraphPageClient() {
  const apiFetch = useApiFetch()
  const { activeProfile } = useProfile()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Filter state
  const [nodeTypes, setNodeTypes] = useState<Set<NodeType>>(
    new Set(NODE_TYPES)
  )
  const [dateRange, setDateRange] = useState<{
    from: Date | null
    to: Date | null
  }>({ from: null, to: null })

  // Node selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Query results state
  const [queryResults, setQueryResults] = useState<GraphQueryResponse | null>(null)

  const queryClient = useQueryClient()

  // Build query string
  const profileId = activeProfile?.id ?? null
  const params = new URLSearchParams()
  if (profileId) params.set("profile_id", profileId)
  if (dateRange.from) params.set("from", dateRange.from.toISOString())
  if (dateRange.to) params.set("to", dateRange.to.toISOString())
  params.set("limit", "200")
  const queryString = params.toString()

  const {
    data: graphData,
    isLoading,
    error,
    refetch,
  } = useQuery<GraphResponse>({
    queryKey: ["graph", "nodes", profileId, Array.from(nodeTypes).sort().join(","), dateRange.from?.toISOString() ?? "", dateRange.to?.toISOString() ?? ""],
    queryFn: () => apiFetch<GraphResponse>(`/v1/graph/nodes?${queryString}`),
    staleTime: 60_000,
    retry: 1,
  })

  // Filter nodes by type
  const filteredNodes = graphData?.nodes.filter((n) =>
    nodeTypes.has(n.type as NodeType)
  ) ?? []

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    setIsPanelOpen(true)
  }, [])

  const handleResultCardClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    setIsPanelOpen(true)
  }, [])

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false)
    // Delay clearing selectedNodeId to allow close animation
    setTimeout(() => {
      setSelectedNodeId(null)
    }, 300)
  }, [])

  const handleClearFilters = useCallback(() => {
    setNodeTypes(new Set(NODE_TYPES))
    setDateRange({ from: null, to: null })
  }, [])

  const hasSources = (graphData?.nodes.length ?? 0) > 0
  const isEmpty = filteredNodes.length === 0 && !isLoading

  // Clear selectedNodeId when filters change to avoid stale panel data
  const handleNodeTypesChange = useCallback((types: Set<NodeType>) => {
    setNodeTypes(types)
    setSelectedNodeId(null)
    setIsPanelOpen(false)
  }, [])

  const handleDateRangeChange = useCallback((range: { from: Date | null; to: Date | null }) => {
    setDateRange(range)
    setSelectedNodeId(null)
    setIsPanelOpen(false)
  }, [])

  // Determine which empty state to show
  const getEmptyState = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-100 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-serif text-xl mb-2">Knowledge graph unavailable</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Unable to load graph data. Your knowledge is safe — we&apos;re working on reconnecting the graph database.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      )
    }
    if (isEmpty) {
      // If we have filters applied, show "no matching nodes"
      if (nodeTypes.size < NODE_TYPES.length || dateRange.from || dateRange.to) {
        return (
          <GraphEmptyState
            isProcessing={false}
            hasSources={hasSources}
            onClearFilters={handleClearFilters}
          />
        )
      }
      // No sources at all
      return <GraphEmptyState isProcessing={false} hasSources={false} />
    }
    return null
  }

  const emptyState = getEmptyState()

  return (
    <div className="flex flex-col h-full">
      {/* Query bar */}
      <GraphQueryBar
        onResults={setQueryResults}
        profileId={profileId}
      />

      {/* Filters */}
      <GraphFilters
        profileId={profileId}
        nodeTypes={nodeTypes}
        dateRange={dateRange}
        onNodeTypesChange={handleNodeTypesChange}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Main content */}
      <div className="flex-1 p-4 overflow-hidden">
        {isMobile ? (
          // Mobile: ConceptList
          <ConceptList
            nodes={filteredNodes}
            isLoading={isLoading}
            onNodeSelect={handleNodeSelect}
          />
        ) : (
          // Desktop: GraphExplorer
          <>
            {emptyState ? (
              emptyState
            ) : (
              <GraphExplorer
                nodes={filteredNodes}
                edges={graphData?.edges ?? []}
                isLoading={isLoading}
                error={error ? "Failed to load graph" : null}
                onNodeSelect={handleNodeSelect}
                queryResults={queryResults}
                onResultCardClick={handleResultCardClick}
              />
            )}
          </>
        )}
      </div>

      {/* Query results panel */}
      {queryResults && !isMobile && (
        <div className="w-80 border-l border-border bg-card p-4 overflow-y-auto">
          <GraphQueryResults
            queryResults={queryResults}
            onResultCardClick={handleResultCardClick}
          />
        </div>
      )}

      {/* Node detail panel */}
      <GraphNodePanel
        selectedNodeId={selectedNodeId}
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        onNodeSelect={handleNodeSelect}
      />
    </div>
  )
}
