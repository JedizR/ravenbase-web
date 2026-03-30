"use client"

import { useEffect, useRef } from "react"
import type { GraphNode, GraphEdge } from "@/src/lib/api-client/types.gen"
import { Skeleton } from "@/components/ui/skeleton"

interface GraphExplorerProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  isLoading: boolean
  error: string | null
  onNodeSelect: (nodeId: string) => void
}

const NODE_COLORS: Record<string, string> = {
  concept: "#2d4a3e",
  memory: "#e8ebe6",
  source: "#a8c4b2",
  conflict: "#ffc00d",
}

export function GraphExplorer({
  nodes,
  edges,
  isLoading,
  error,
  onNodeSelect,
}: GraphExplorerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy()
      cyRef.current = null
    }

    // No nodes to render
    if (nodes.length === 0) return

    const elements: cytoscape.ElementDefinition[] = [
      ...nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
        },
      })),
      ...edges.map((edge) => ({
        data: {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          type: edge.type,
        },
      })),
    ]

    let mounted = true

    const initCytoscape = async () => {
      try {
        const cytoscapeModule = await import("cytoscape")
        const cytoscape = cytoscapeModule.default
        const fcoseModule = await import("cytoscape-fcose")
        const fcose = fcoseModule.default
        cytoscape.use(fcose)

        if (!mounted || !containerRef.current) return

        const cy = cytoscape({
          container: containerRef.current,
          elements,
          style: [
            {
              selector: "node",
              style: {
                label: "data(label)",
                "text-valign": "bottom",
                "text-margin-y": 8,
                "font-size": 10,
                "font-family": "JetBrains Mono, monospace",
                color: "#1a1a1a",
                "text-outline-color": "#f5f3ee",
                "text-outline-width": 2,
              } as cytoscape.Css.Node,
            },
            {
              selector: 'node[type="concept"]',
              style: {
                "background-color": NODE_COLORS.concept,
              },
            },
            {
              selector: 'node[type="memory"]',
              style: {
                "background-color": NODE_COLORS.memory,
                "border-width": 1,
                "border-color": "#ccc",
              },
            },
            {
              selector: 'node[type="source"]',
              style: {
                "background-color": NODE_COLORS.source,
              },
            },
            {
              selector: 'node[type="conflict"]',
              style: {
                "background-color": NODE_COLORS.conflict,
                "border-width": 3,
                "border-color": NODE_COLORS.conflict,
                width: 28,
                height: 28,
              },
            },
            {
              selector: "edge",
              style: {
                width: 1.5,
                "line-color": "#d1d5db",
                "target-arrow-color": "#d1d5db",
                "target-arrow-shape": "triangle",
                "curve-style": "bezier",
              },
            },
          ],
          layout: {
            name: "fcose",
            animate: true,
            randomize: true,
            idealEdgeLength: 100,
            nodeRepulsion: 8000,
            edgeElasticity: 0.1,
            gravity: 0.3,
          } as cytoscape.LayoutOptions,
        })

        cy.on("tap", "node", (evt) => {
          const nodeId = evt.target.id()
          onNodeSelect(nodeId)
        })

        cyRef.current = cy
      } catch (err) {
        console.error("Failed to initialize Cytoscape:", err)
      }
    }

    initCytoscape()

    return () => {
      mounted = false
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [nodes, edges, onNodeSelect])

  if (isLoading) {
    return <Skeleton className="w-full h-[600px] rounded-2xl" />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] rounded-2xl border border-destructive bg-card">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] rounded-2xl bg-card border border-border"
      aria-label="Knowledge graph visualization"
    />
  )
}
