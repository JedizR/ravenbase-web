"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useProfile } from "@/contexts/ProfileContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const NODE_TYPES = ["concept", "memory", "source", "conflict"] as const
type NodeType = (typeof NODE_TYPES)[number]

interface GraphFiltersProps {
  profileId: string | null
  nodeTypes: Set<NodeType>
  dateRange: { from: Date | null; to: Date | null }
  onNodeTypesChange: (types: Set<NodeType>) => void
  onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void
}

function Checkbox({
  checked,
  onCheckedChange,
  label,
  id,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  id: string
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="checkbox"
        id={id}
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-input shadow-xs transition-colors",
          checked && "bg-primary border-primary"
        )}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  )
}

export function GraphFilters({
  profileId,
  nodeTypes,
  dateRange,
  onNodeTypesChange,
  onDateRangeChange,
}: GraphFiltersProps) {
  const queryClient = useQueryClient()
  const { profiles } = useProfile()

  const handleProfileChange = (newProfileId: string) => {
    queryClient.invalidateQueries({ queryKey: ["graph", "nodes"] })
  }

  const handleNodeTypeToggle = (type: NodeType) => {
    const newTypes = new Set(nodeTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    onNodeTypesChange(newTypes)
    queryClient.invalidateQueries({ queryKey: ["graph", "nodes"] })
  }

  const handleSelectAll = () => {
    onNodeTypesChange(new Set(NODE_TYPES))
    queryClient.invalidateQueries({ queryKey: ["graph", "nodes"] })
  }

  const handleDateFromChange = (value: string) => {
    onDateRangeChange({
      from: value ? new Date(value) : null,
      to: dateRange.to,
    })
    queryClient.invalidateQueries({ queryKey: ["graph", "nodes"] })
  }

  const handleDateToChange = (value: string) => {
    onDateRangeChange({
      from: dateRange.from,
      to: value ? new Date(value) : null,
    })
    queryClient.invalidateQueries({ queryKey: ["graph", "nodes"] })
  }

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 border-b border-border bg-card rounded-t-2xl">
      <span className="font-mono text-xs text-muted-foreground tracking-wider">
        ◆ FILTERS
      </span>

      {/* Profile selector */}
      <Select value={profileId ?? ""} onValueChange={handleProfileChange}>
        <SelectTrigger className="w-[180px] h-8" size="sm">
          <SelectValue placeholder="All Profiles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Profiles</SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateRange.from?.toISOString().split("T")[0] ?? ""}
          onChange={(e) => handleDateFromChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
        />
        <span className="text-muted-foreground">to</span>
        <input
          type="date"
          value={dateRange.to?.toISOString().split("T")[0] ?? ""}
          onChange={(e) => handleDateToChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
        />
      </div>

      {/* Node type checkboxes */}
      <div className="flex items-center gap-4">
        {NODE_TYPES.map((type) => (
          <Checkbox
            key={type}
            id={`filter-${type}`}
            checked={nodeTypes.has(type)}
            onCheckedChange={() => handleNodeTypeToggle(type)}
            label={type.charAt(0).toUpperCase() + type.slice(1)}
          />
        ))}
      </div>
    </div>
  )
}
