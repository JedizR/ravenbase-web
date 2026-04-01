"use client"

import { useState, useEffect, useId } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ---------------------------------------------------------------------------
// useEdgeId — React useId() for guaranteed unique edge keys, never collides
// ---------------------------------------------------------------------------
function useEdgeId() {
  const reactId = useId()  // e.g. ":r1:" — stable across renders
  const counterRef = { current: 0 }

  function nextId(): string {
    return `${reactId}-${counterRef.current++}`
  }

  return { nextId }
}

// ---------------------------------------------------------------------------
// Constants — 70% of previous scale
// ---------------------------------------------------------------------------

const VIEWBOX_WIDTH = 576
const VIEWBOX_HEIGHT = 481
const CENTER_X = VIEWBOX_WIDTH / 2   // 288
const CENTER_Y = VIEWBOX_HEIGHT / 2 // 240

const LABEL_POOL = [
  "Python", "AI Agents", "Research", "Design", "Code",
  "Study", "Context", "Knowledge", "Graph", "Conflicts",
  "Sources", "Insights", "Synthesis", "Retrieval", "Vectors",
  "Embeddings", "Neo4j", "Qdrant", "LLM", "RAG",
  "Ingestion", "Chunking", "Entities", "Relations", "Database",
  "API", "MLOps", "Docker", "Git", "Linux",
]

// 5 inner nodes at 72° intervals; 12 outer nodes at 30° intervals
const INNER_ANGLES_DEG = [0, 72, 144, 216, 288]
const OUTER_ANGLES_DEG = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345]

// 70% of previous: INNER 130→91, OUTER 234→164
const INNER_DISTANCE = 91
const OUTER_DISTANCE = 164

// Radii 70%: HUB 38→27, INNER 27→19, OUTER 20→14
const HUB_R = 27
const INNER_R = 19
const OUTER_R = 14

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NodeData {
  id: string
  label: string
  x: number
  y: number
  r: number
  orbit: 0 | 1 | 2
  hasGlow: boolean
  entranceDelay: number
}

interface EdgeData {
  id: string
  fromId: string
  toId: string
  path: string
  entranceDelay: number
}

interface GraphData {
  nodes: NodeData[]
  edges: EdgeData[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function jitter(value: number, amount: number): number {
  return value + (Math.random() - 0.5) * 2 * amount
}

function buildCurve(from: NodeData, to: NodeData): string {
  const mx = (from.x + to.x) / 2 + (to.y - from.y) * 0.18
  const my = (from.y + to.y) / 2 - (to.x - from.x) * 0.18
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`
}

function estimateTextWidth(label: string, fontSize: number): number {
  const pxPerChar = fontSize * 0.58
  const paddingX = 10
  return Math.ceil(label.length * pxPerChar + paddingX)
}

function getFontSize(r: number): number {
  if (r >= 25) return 9
  return 7
}

// ---------------------------------------------------------------------------
// Graph Generator — generates once, no churn
// ---------------------------------------------------------------------------

function generateGraph(nextId: () => string): GraphData {
  // Filter "Memory" out before shuffling — hub always owns it
  const poolSansMemory = LABEL_POOL.filter((l) => l !== "Memory")
  const shuffled = [...poolSansMemory].sort(() => Math.random() - 0.5)

  const innerCount = 5
  const outerCount = 12
  const totalNeeded = innerCount + outerCount

  const selectedLabels = shuffled.slice(0, Math.min(totalNeeded, shuffled.length))
  const innerLabels = selectedLabels.slice(0, innerCount)
  const outerLabels = selectedLabels.slice(innerCount)

  const nodes: NodeData[] = []

  // Hub
  nodes.push({
    id: "n0",
    label: "Memory",
    x: CENTER_X,
    y: CENTER_Y,
    r: HUB_R,
    orbit: 0,
    hasGlow: true,
    entranceDelay: 0.1,
  })

  // Inner ring — ±4° jitter, ±3px distance jitter
  for (let i = 0; i < innerCount; i++) {
    const baseAngle = INNER_ANGLES_DEG[i]
    const angle = degToRad(jitter(baseAngle, 4))
    const dist = jitter(INNER_DISTANCE, 3)
    const x = CENTER_X + dist * Math.cos(angle)
    const y = CENTER_Y + dist * Math.sin(angle)

    nodes.push({
      id: `n${i + 1}`,
      label: innerLabels[i],
      x,
      y,
      r: INNER_R,
      orbit: 1,
      hasGlow: Math.random() < 0.3,
      entranceDelay: 0.3 + (i + 1) * 0.1,
    })
  }

  // Outer ring — ±4° jitter, ±6px distance jitter, ALWAYS exactly 12 nodes
  for (let i = 0; i < outerCount; i++) {
    const baseAngle = OUTER_ANGLES_DEG[i]
    const angle = degToRad(jitter(baseAngle, 4))
    const dist = jitter(OUTER_DISTANCE, 6)
    const x = CENTER_X + dist * Math.cos(angle)
    const y = CENTER_Y + dist * Math.sin(angle)

    nodes.push({
      id: `n${1 + innerCount + i}`,
      label: outerLabels[i] ?? "Query",
      x,
      y,
      r: jitter(OUTER_R, 1),
      orbit: 2,
      hasGlow: Math.random() < 0.15,
      entranceDelay: 0.5 + i * 0.06,
    })
  }

  // Build edges
  const edges: EdgeData[] = []
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const seenEdges = new Set<string>()

  function addEdge(from: string, to: string, delay: number, path: string) {
    const key = [from, to].sort().join("--")
    if (seenEdges.has(key)) return
    seenEdges.add(key)
    edges.push({ id: nextId(), fromId: from, toId: to, path, entranceDelay: delay })
  }

  let edgeDelay = 0

  // Hub → all inner nodes
  for (let i = 1; i <= innerCount; i++) {
    const from = nodeMap.get("n0")!
    const to = nodeMap.get(`n${i}`)!
    if (from && to) {
      addEdge("n0", `n${i}`, edgeDelay, buildCurve(from, to))
      edgeDelay += 0.04
    }
  }

  // Inner ring: adjacent pairs
  for (let i = 1; i <= innerCount; i++) {
    const next = i === innerCount ? 1 : i + 1
    const fromNode = nodeMap.get(`n${i}`)
    const toNode = nodeMap.get(`n${next}`)
    if (fromNode && toNode && Math.random() < 0.8) {
      addEdge(`n${i}`, `n${next}`, edgeDelay, buildCurve(fromNode, toNode))
      edgeDelay += 0.04
    }
  }

  // Inner → outer connections
  const innerNodes = nodes.filter((n) => n.orbit === 1)
  const outerNodes = nodes.filter((n) => n.orbit === 2)
  for (const inner of innerNodes) {
    for (const outer of outerNodes) {
      if (Math.random() < 0.5) {
        addEdge(inner.id, outer.id, edgeDelay, buildCurve(inner, outer))
        edgeDelay += 0.04
      }
    }
  }

  // Outer → outer (very sparse)
  for (let i = 0; i < outerNodes.length; i++) {
    for (let j = i + 1; j < outerNodes.length; j++) {
      if (Math.random() < 0.15) {
        addEdge(outerNodes[i].id, outerNodes[j].id, edgeDelay, buildCurve(outerNodes[i], outerNodes[j]))
        edgeDelay += 0.04
      }
    }
  }

  // Hub → some outer nodes (rare)
  for (const outer of outerNodes) {
    if (Math.random() < 0.1) {
      const hub = nodeMap.get("n0")!
      addEdge("n0", outer.id, edgeDelay, buildCurve(hub, outer))
      edgeDelay += 0.04
    }
  }

  return { nodes, edges }
}

// ---------------------------------------------------------------------------
// AnimatedGraph Component
// ---------------------------------------------------------------------------

export function AnimatedGraph({ className }: { className?: string }) {
  const [graph, setGraph] = useState<GraphData | null>(null)
  const { nextId } = useEdgeId()

  // Generate graph ONLY on the client after mount — zero SSR involvement
  useEffect(() => {
    setGraph(generateGraph(nextId))
  }, [])

  // SSR: return an empty shell identical on server and client
  if (!graph) {
    return (
      <div
        className={className}
        aria-hidden="true"
        suppressHydrationWarning
      />
    )
  }

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]))

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* ── SVG Filter Definitions ── */}
      <defs>
        <filter
          id="glow-ring"
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.6 0"
            result="coloredBlur"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Edges Layer ── */}
      <g>
        <AnimatePresence>
          {graph.edges.map((edge) => {
            const fromNode = nodeMap.get(edge.fromId)
            const toNode = nodeMap.get(edge.toId)
            if (!fromNode || !toNode) return null

            return (
              <motion.path
                key={edge.id}
                d={edge.path}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.5}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 0.7, 0.4] }}
                transition={{
                  pathLength: { duration: 0.8, delay: edge.entranceDelay, ease: "easeOut" },
                  opacity: { duration: 3.5, delay: edge.entranceDelay + 0.4, repeat: Infinity, ease: "easeInOut" },
                }}
              />
            )
          })}
        </AnimatePresence>
      </g>

      {/* ── Nodes Layer ── */}
      <AnimatePresence>
        {graph.nodes.map((node) => {
          const fontSize = getFontSize(node.r)
          const pillWidth = estimateTextWidth(node.label, fontSize)
          const pillHeight = 14
          const fontWeight = node.orbit === 0 ? "600" : "500"

          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                scale: { duration: 0.5, delay: node.entranceDelay, ease: "backOut" },
                opacity: { duration: 0.4, delay: node.entranceDelay + 0.1 },
              }}
            >
              {/* Position via inner SVG g with native transform attribute */}
              <g transform={`translate(${node.x}, ${node.y})`}>
                {/* Glow ring — fades in once, holds steady */}
                {node.hasGlow && (
                  <motion.circle
                    r={node.r + 6}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth={1.5}
                    filter="url(#glow-ring)"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 0.7], scale: 1 }}
                    transition={{
                      opacity: { duration: 0.8, delay: node.entranceDelay + 0.8 },
                      scale: { duration: 0.5, delay: node.entranceDelay, ease: "backOut" },
                    }}
                  />
                )}

                {/* Main node circle */}
                <motion.circle
                  r={node.r}
                  fill="var(--primary)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    scale: { duration: 0.5, delay: node.entranceDelay, ease: "backOut" },
                    opacity: { duration: 0.4, delay: node.entranceDelay + 0.1 },
                  }}
                />

                {/* Pill background — sized to text */}
                <motion.rect
                  x={-pillWidth / 2}
                  y={-pillHeight / 2}
                  width={pillWidth}
                  height={pillHeight}
                  rx={pillHeight / 2}
                  fill="currentColor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: node.entranceDelay + 0.15 }}
                  className="pointer-events-none select-none"
                />

                {/* Node label text */}
                <motion.text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize}
                  fontFamily="var(--font-mono, monospace)"
                  fontWeight={fontWeight}
                  fill="white"
                  letterSpacing="0.03em"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: node.entranceDelay + 0.2 }}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.label}
                </motion.text>
              </g>
            </motion.g>
          )
        })}
      </AnimatePresence>
    </svg>
  )
}
