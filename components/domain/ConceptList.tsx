"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { GraphNode } from "@/src/lib/api-client/types.gen"
import { Search } from "lucide-react"

interface ConceptListProps {
  nodes: GraphNode[]
  isLoading: boolean
  onNodeSelect: (nodeId: string) => void
}

const NODE_TYPES = ["all", "concept", "memory", "source", "conflict"] as const
type NodeTypeFilter = (typeof NODE_TYPES)[number]

function NodeTypeBadge({ type }: { type: string }) {
  const label = type.toUpperCase()

  const className =
    type === "conflict"
      ? "font-mono text-xs text-warning"
      : type === "concept"
        ? "font-mono text-xs text-primary"
        : type === "memory"
          ? "font-mono text-xs text-muted-foreground"
          : "font-mono text-xs text-accent-foreground"

  return <span className={className}>◆ {label}</span>
}

function ConceptListItem({
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
      className="flex items-center justify-between w-full p-3 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-left"
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground truncate">
          {node.label}
        </span>
        <div className="flex items-center gap-2">
          <NodeTypeBadge type={node.type} />
          {node.memory_count !== undefined && node.memory_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {node.memory_count} memories
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function ConceptList({
  nodes,
  isLoading,
  onNodeSelect,
}: ConceptListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<NodeTypeFilter>("all")

  const filteredNodes = useMemo(() => {
    let result = nodes

    // Filter by type
    if (activeTab !== "all") {
      result = result.filter((n) => n.type === activeTab)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((n) => n.label.toLowerCase().includes(query))
    }

    return result
  }, [nodes, activeTab, searchQuery])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="p-4 pb-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as NodeTypeFilter)}
        >
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            {NODE_TYPES.map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="capitalize text-xs"
              >
                {type === "all"
                  ? "All"
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No concepts match your search."
                : "No concepts found."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNodes.map((node) => (
              <ConceptListItem
                key={node.id}
                node={node}
                onClick={() => onNodeSelect(node.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
