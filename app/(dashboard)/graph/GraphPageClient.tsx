"use client"

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useProfile } from "@/contexts/ProfileContext"
import { useApiFetch } from "@/lib/api-client"
import { GraphFilters } from "@/components/domain/GraphFilters"
import { GraphNodePanel } from "@/components/domain/GraphNodePanel"
import { GraphEmptyState } from "@/components/domain/GraphEmptyState"
import { ConceptList } from "@/components/domain/ConceptList"
import { Skeleton } from "@/components/ui/skeleton"
import type { GraphNode, GraphEdge, GraphResponse } from "@/src/lib/api-client/types.gen"

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

  // Build query string
  const profileId = activeProfile?.id ?? null
  const params = new URLSearchParams()
  if (profileId) params.set("profile_id", profileId)
  params.set("limit", "200")
  const queryString = params.toString()

  const {
    data: graphData,
    isLoading,
    error,
  } = useQuery<GraphResponse>({
    queryKey: ["graph", "nodes", profileId, nodeTypes],
    queryFn: () => apiFetch<GraphResponse>(`/v1/graph/nodes?${queryString}`),
    staleTime: 60_000,
  })

  // Filter nodes by type
  const filteredNodes = graphData?.nodes.filter((n) =>
    nodeTypes.has(n.type as NodeType)
  ) ?? []

  const handleNodeSelect = useCallback((nodeId: string) => {
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

  // Determine which empty state to show
  const getEmptyState = () => {
    if (error) {
      return (
        <GraphEmptyState
          isProcessing={false}
          hasSources={hasSources}
          onClearFilters={handleClearFilters}
        />
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
      {/* Filters */}
      <GraphFilters
        profileId={profileId}
        nodeTypes={nodeTypes}
        dateRange={dateRange}
        onNodeTypesChange={setNodeTypes}
        onDateRangeChange={setDateRange}
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
              />
            )}
          </>
        )}
      </div>

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
