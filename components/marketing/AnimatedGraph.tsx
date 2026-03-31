"use client"

import { motion } from "framer-motion"

interface GraphNode {
  id: string
  x: number
  y: number
  r: number
}

const NODES: GraphNode[] = [
  { id: "n0",  x: 240, y: 180, r: 8 },
  { id: "n1",  x: 195, y: 140, r: 6 },
  { id: "n2",  x: 285, y: 145, r: 6 },
  { id: "n3",  x: 200, y: 222, r: 5 },
  { id: "n4",  x: 280, y: 216, r: 5 },
  { id: "n5",  x: 160, y: 175, r: 5 },
  { id: "n6",  x: 320, y: 178, r: 5 },
  { id: "n7",  x: 110, y: 120, r: 7 },
  { id: "n8",  x:  70, y: 155, r: 5 },
  { id: "n9",  x:  90, y: 200, r: 5 },
  { id: "n10", x: 130, y: 242, r: 4 },
  { id: "n11", x:  55, y: 110, r: 4 },
  { id: "n12", x: 370, y: 120, r: 7 },
  { id: "n13", x: 415, y: 155, r: 5 },
  { id: "n14", x: 400, y: 206, r: 5 },
  { id: "n15", x: 355, y: 246, r: 4 },
  { id: "n16", x: 430, y: 106, r: 4 },
  { id: "n17", x: 230, y:  70, r: 6 },
  { id: "n18", x: 175, y:  46, r: 4 },
  { id: "n19", x: 295, y:  56, r: 4 },
  { id: "n20", x: 240, y: 316, r: 6 },
  { id: "n21", x: 190, y: 346, r: 4 },
  { id: "n22", x: 295, y: 340, r: 4 },
  { id: "n23", x: 155, y: 290, r: 4 },
]

const EDGES: [string, string][] = [
  ["n0","n1"], ["n0","n2"], ["n0","n3"], ["n0","n4"],
  ["n0","n5"], ["n0","n6"], ["n1","n7"], ["n2","n12"],
  ["n5","n7"], ["n6","n12"], ["n3","n20"], ["n4","n20"],
  ["n7","n8"], ["n7","n9"], ["n7","n10"], ["n8","n11"],
  ["n9","n10"], ["n5","n9"],
  ["n12","n13"], ["n12","n14"], ["n12","n15"], ["n13","n16"],
  ["n14","n15"], ["n6","n14"],
  ["n1","n17"], ["n2","n17"], ["n17","n18"], ["n17","n19"],
  ["n20","n21"], ["n20","n22"], ["n3","n23"], ["n23","n21"],
  ["n7","n17"], ["n12","n17"], ["n10","n20"], ["n15","n20"],
]

const nodeMap = new Map(NODES.map((n) => [n.id, n]))

export function AnimatedGraph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 400"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Edges */}
      <g>
        {EDGES.map(([fromId, toId], i) => {
          const from = nodeMap.get(fromId)
          const to = nodeMap.get(toId)
          if (!from || !to) return null
          return (
            <motion.line
              key={`e-${i}`}
              x1={from.x} y1={from.y}
              x2={to.x}   y2={to.y}
              className="stroke-accent"
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{
                duration: 3.5,
                delay: (i * 0.12) % 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )
        })}
      </g>
      {/* Nodes */}
      <g>
        {NODES.map((node, i) => (
          <motion.circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={node.r}
            className="fill-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{
              duration: 2.8,
              delay: (i * 0.15) % 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </g>
    </svg>
  )
}
