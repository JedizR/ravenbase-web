"use client"

import { useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useApiFetch } from "@/lib/api-client"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ExternalLink } from "lucide-react"
import type { GraphNode, GraphEdge, GraphResponse } from "@/src/lib/api-client/types.gen"

interface GraphNodePanelProps {
  selectedNodeId: string | null
  isOpen: boolean
  onClose: () => void
  onNodeSelect: (nodeId: string) => void
}

function NodeTypeBadge({ type }: { type: string }) {
  const label = type.toUpperCase()

  const className =
    type === "conflict"
      ? "font-mono text-xs text-warning animate-pulse"
      : type === "concept"
        ? "font-mono text-xs text-primary"
        : type === "memory"
          ? "font-mono text-xs text-muted-foreground"
          : "font-mono text-xs text-accent-foreground"

  return <span className={className}>◆ {label}</span>
}

function NodeProperty({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-mono text-muted-foreground tracking-wider">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

function ConnectedNodeItem({
  node,
  onClick,
}: {
  node: GraphNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full p-2 rounded-md hover:bg-secondary transition-colors text-left"
    >
      <span className="text-sm text-foreground truncate">{node.label}</span>
      <NodeTypeBadge type={node.type} />
    </button>
  )
}

export function GraphNodePanel({
  selectedNodeId,
  isOpen,
  onClose,
  onNodeSelect,
}: GraphNodePanelProps) {
  const apiFetch = useApiFetch()
  const router = useRouter()
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const { data: neighborhoodData, isLoading, error } = useQuery({
    queryKey: ["graph", "neighborhood", selectedNodeId],
    queryFn: () =>
      apiFetch<GraphResponse>(
        `/v1/graph/neighborhood/${selectedNodeId}?hops=2`
      ),
    enabled: !!selectedNodeId,
    staleTime: 30_000,
  })

  // Find the selected node in neighborhood data
  const selectedNode = neighborhoodData?.nodes.find(
    (n) => n.id === selectedNodeId
  )

  const handleClose = () => {
    // Delay clearing selectedNodeId to allow close animation
    closeTimeoutRef.current = setTimeout(() => {
      onClose()
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
        {isLoading && (
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <AlertTriangle className="size-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Could not load node details. Try again.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                // Retry by re-triggering the query
                if (selectedNodeId) {
                  onNodeSelect(selectedNodeId)
                }
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && selectedNode && (
          <>
            <SheetHeader>
              <SheetTitle className="font-serif text-xl">
                {selectedNode.label}
              </SheetTitle>
              <NodeTypeBadge type={selectedNode.type} />
            </SheetHeader>

            <div className="flex flex-col gap-6 p-4 overflow-y-auto">
              {/* Properties section */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-mono text-muted-foreground tracking-wider">
                  ◆ PROPERTIES
                </h3>
                <div className="space-y-3">
                  <NodeProperty
                    label="ID"
                    value={selectedNode.id}
                  />
                  <NodeProperty
                    label="TYPE"
                    value={selectedNode.type}
                  />
                  {selectedNode.properties && (
                    <>
                      <NodeProperty
                        label="CREATED"
                        value={
                          selectedNode.properties.created_at as string | null
                        }
                      />
                      <NodeProperty
                        label="SOURCE"
                        value={
                          selectedNode.properties.source_filename as string | null
                        }
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Conflict warning card */}
              {selectedNode.type === "conflict" && (
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className="size-4 text-warning"
                      style={{
                        color: "var(--warning-foreground, #1a1a1a)",
                      }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      Unresolved Conflict
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This conflict needs your attention. Review and resolve it in
                    the inbox.
                  </p>
                  <Button
                    className="w-full rounded-full"
                    onClick={() =>
                      router.push(`/inbox?conflict_id=${selectedNode.id}`)
                    }
                  >
                    <ExternalLink className="size-4" />
                    View in Inbox
                  </Button>
                </div>
              )}

              {/* Connected nodes section */}
              {neighborhoodData &&
                neighborhoodData.nodes.length > 1 &&
                selectedNode.type !== "conflict" && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-mono text-muted-foreground tracking-wider">
                      ◆ CONNECTED NODES ({neighborhoodData.nodes.length - 1})
                    </h3>
                    <div className="space-y-1">
                      {neighborhoodData.nodes
                        .filter((n) => n.id !== selectedNodeId)
                        .slice(0, 10)
                        .map((node) => (
                          <ConnectedNodeItem
                            key={node.id}
                            node={node}
                            onClick={() => onNodeSelect(node.id)}
                          />
                        ))}
                      {neighborhoodData.nodes.length > 11 && (
                        <p className="text-xs text-muted-foreground pt-2">
                          +{neighborhoodData.nodes.length - 11} more nodes
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
