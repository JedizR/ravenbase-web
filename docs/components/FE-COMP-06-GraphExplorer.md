# GraphExplorer

> **Component ID:** FE-COMP-06
> **Epic:** EPIC-03 — Knowledge Graph Layer
> **Stories:** STORY-011, STORY-030
> **Type:** Frontend (Dashboard)

---

## Goal

The Graph Explorer is the visual interface for Ravenbase's hybrid vector + knowledge graph architecture. It renders a force-directed graph of Concept nodes, Memory nodes, Source nodes, and Conflict nodes using Cytoscape.js. Users can click nodes to see details, filter by profile/date/node type, and navigate between the graph and the Memory Inbox. On mobile, it gracefully degrades to a searchable concept list.

---

## Product Requirements

1. **Route:** Graph Explorer accessible at `/dashboard/graph`. Loads full graph (up to 300 nodes) on mount. Empty state when no sources exist.

2. **Cytoscape.js Rendering:** Force-directed graph using `fcose` layout (faster than default cose). Node types: `concept` (blue/primary), `memory` (slate/secondary), `source` (violet/accent), `conflict` (amber/warning, pulsing).

3. **Node Click → Detail Panel:** Clicking any node opens a right-side panel (`GraphNodePanel`) showing node details and linked memories. Panel shows: label, type, created date, source file, and connected edges.

4. **Filters Sidebar:** Profile dropdown, date range picker, node type checkboxes (Concept, Memory, Source, Conflict). Filters update the graph in real-time via `apiFetch`.

5. **Neighborhood Expansion:** Clicking a node fetches its 2-hop neighborhood from `GET /v1/graph/neighborhood/{node_id}?hops=2` and highlights the subgraph.

6. **Conflict Nodes:** Conflict nodes pulse with amber animation. Each conflict node has an "Open in Inbox" button that navigates to `/dashboard/inbox?conflict_id={id}` filtered to that conflict.

7. **Mobile Degradation (< 768px):** Renders a searchable list of concepts instead of Cytoscape. Uses `useMediaQuery("(max-width: 768px)")` to detect.

8. **Empty States:**
   - No sources: State 2 from 04-ux-patterns.md → "Start building your memory" + upload CTA
   - Processing job active: State 1 → "Building Graph" pulsing animation
   - Never renders a blank void

9. **Performance:** Graph loads within 2.5 seconds for up to 300 nodes. Uses TanStack Query with `staleTime: 60_000`.

10. **Graph Controls:** Zoom in/out (`+`/`-`), fit-to-screen (`F`), pan with arrow keys. Keyboard shortcuts shown in `?` overlay.

11. **Active Profile Context:** Profile filter scopes graph to selected `profile_id`. Graph refetches when active profile changes via query key invalidation.

---

## Criteria and Tests

| Criterion | Test |
|---|---|
| Graph renders with seeded nodes | Navigate to /dashboard/graph → force-directed graph visible |
| Node types have distinct colors | Visual check: concept=green, memory=slate, source=violet, conflict=amber |
| Click node opens detail panel | Click any node → GraphNodePanel slides in from right |
| Neighborhood expands on click | Click node → /v1/graph/neighborhood called, subgraph highlighted |
| Profile filter scopes graph | Select profile → graph refetches with profile_id filter |
| Date range filter works | Set date range → graph refetches |
| Node type filter works | Uncheck "Conflict" → conflict nodes hidden |
| Conflict nodes pulse amber | Visual check: conflict nodes animate |
| "Open in Inbox" on conflict node | Click conflict node → button in panel → /dashboard/inbox |
| Mobile degrades to list at 375px | Resize browser → concept list renders instead of graph |
| Empty state shows when no sources | Delete all sources → empty state with CTA |
| Graph loads within 2.5s | Performance: graph with 300 nodes renders in < 2.5s |
| Zoom/pan keyboard shortcuts work | Press + → zoom in; F → fit to screen |
| Active profile change refetches graph | Switch profile in Omnibar → graph updates |

---

## Related Stories

| Story | Title | Type | Description |
|---|---|---|---|
| [STORY-011](docs/stories/EPIC-03-graph/STORY-011.md) | Graph Explorer UI (Cytoscape.js) | Frontend | Full graph visualization with Cytoscape |
| [STORY-010](docs/stories/EPIC-03-graph/STORY-010.md) | Graph API Endpoints | Backend | /v1/graph/nodes and /v1/graph/neighborhood |
| [STORY-030](docs/stories/EPIC-09-memory-intelligence/STORY-030.md) | NL Graph Query Frontend | Frontend | Natural language query input in graph view |

---

## Component Files

```
components/domain/
  GraphExplorer.tsx      — Main Cytoscape.js wrapper
  GraphNodePanel.tsx     — Right-side node detail panel
  GraphFilters.tsx       — Filter controls (profile, date, type)
  GraphControls.tsx      — Zoom + fit controls overlay
  ConceptList.tsx       — Mobile fallback list view

hooks/
  use-graph-data.ts      — TanStack Query wrapper for graph endpoints
  use-media-query.ts    — Mobile breakpoint detection

app/(dashboard)/graph/
  page.tsx               — Page layout with sidebar + graph area
  loading.tsx            — Skeleton loading state
```

## Cytoscape Setup Pattern

```tsx
// components/domain/GraphExplorer.tsx
"use client"
import { useEffect, useRef } from "react"
import cytoscape from "cytoscape"
import fcose from "cytoscape-fcose"
import { apiFetch } from "@/lib/api"

cytoscape.use(fcose)

const NODE_COLORS: Record<string, string> = {
  concept:  "#2d4a3e",  // primary green
  memory:   "#e8ebe6",  // secondary
  source:   "#a8c4b2",  // accent sage
  conflict: "#ffc00d",  // warning amber
}

const EDGE_COLORS: Record<string, string> = {
  CONCEPT_MEMORY: "#2d4a3e",
  MEMORY_SOURCE: "#a8c4b2",
  CONTRADICTS: "#ffc00d",
}

export function GraphExplorer({ profileId }: { profileId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    apiFetch<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
      `/v1/graph/nodes?profile_id=${profileId}&limit=300`
    ).then(({ nodes, edges }) => {
      cyRef.current = cytoscape({
        container: containerRef.current!,
        elements: [
          ...nodes.map((n) => ({
            data: { id: n.id, label: n.label, type: n.type },
          })),
          ...edges.map((e) => ({
            data: { source: e.source, target: e.target, type: e.type },
          })),
        ],
        style: [
          {
            selector: "node",
            style: {
              "background-color": (ele) => NODE_COLORS[ele.data("type")] ?? "#d1d5db",
              label: "data(label)",
              color: "#ffffff",
              "font-size": 10,
              width: (ele) => ele.data("type") === "concept" ? 24 : 16,
              height: (ele) => ele.data("type") === "concept" ? 24 : 16,
            },
          },
          {
            selector: "edge",
            style: {
              "line-color": (ele) => EDGE_COLORS[ele.data("type")] ?? "#d1d5db",
              width: 1.5,
              "curve-style": "bezier",
            },
          },
          {
            selector: 'node[type = "conflict"]',
            style: {
              "border-width": 3,
              "border-color": "#ffc00d",
            },
          },
        ],
        layout: { name: "fcose", randomize: true, animate: true },
        minZoom: 0.2,
        maxZoom: 3,
      })

      // Node tap → open detail panel
      cyRef.current.on("tap", "node", (evt) => {
        const nodeId = evt.target.data("id")
        openNodePanel(nodeId)
      })

      // Edge tap → highlight connected nodes
      cyRef.current.on("tap", "edge", (evt) => {
        evt.target.addClass("highlighted")
      })
    })

    return () => cyRef.current?.destroy()
  }, [profileId])

  return <div ref={containerRef} className="w-full h-full" />
}
```

## Node Panel Pattern

```tsx
// components/domain/GraphNodePanel.tsx
interface GraphNodePanelProps {
  nodeId: string | null
  onClose: () => void
}

export function GraphNodePanel({ nodeId, onClose }: GraphNodePanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["graph", "node", nodeId],
    queryFn: () => apiFetch<GraphNodeDetail>(`/v1/graph/neighborhood/${nodeId}?hops=2`),
    enabled: !!nodeId,
  })

  if (!nodeId) return null

  return (
    <aside className="w-80 border-l border-border bg-card p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-lg">Node Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {isLoading && <Skeleton className="h-32 w-full" />}

      {data && (
        <div className="space-y-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">◆ {data.type.toUpperCase()}</p>
            <p className="font-medium mt-1">{data.label}</p>
          </div>

          {data.created_at && (
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{new Date(data.created_at).toLocaleDateString()}</p>
            </div>
          )}

          {data.sources && data.sources.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Sources</p>
              {data.sources.map((s) => (
                <div key={s.id} className="text-sm bg-secondary/50 rounded p-2 mb-1">
                  {s.filename}
                </div>
              ))}
            </div>
          )}

          {data.type === "conflict" && (
            <Button
              className="w-full"
              onClick={() => router.push(`/dashboard/inbox?conflict_id=${data.id}`)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Open in Inbox
            </Button>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">Connections ({data.edges?.length ?? 0})</p>
            {data.edges?.slice(0, 5).map((e) => (
              <div key={e.id} className="text-sm flex items-center gap-2 py-1">
                <span className="font-mono text-xs text-muted-foreground">{e.type}</span>
                <span className="text-xs">{e.target_label ?? e.target_id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
```

## Graph Controls Overlay

```tsx
// components/domain/GraphControls.tsx
// Floating control buttons over the graph area
export function GraphControls({ cyRef }: { cyRef: React.RefObject<cytoscape.Core | null> }) {
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3)
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.3)
  const handleFit = () => cyRef.current?.fit(undefined, 50)

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-1">
      <Button variant="outline" size="icon" onClick={handleZoomIn} aria-label="Zoom in">
        <Plus className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleZoomOut} aria-label="Zoom out">
        <Minus className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleFit} aria-label="Fit to screen">
        <Maximize2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
```

## Mobile Concept List Pattern

```tsx
// components/domain/ConceptList.tsx
// Mobile fallback: searchable list instead of Cytoscape graph
export function ConceptList({ profileId }: { profileId: string }) {
  const [search, setSearch] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["graph", "nodes", profileId],
    queryFn: () => apiFetch<{ nodes: GraphNode[] }>("/v1/graph/nodes?type=concept"),
    staleTime: 60_000,
  })

  const filtered = data?.nodes.filter((n) =>
    n.label.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="p-4 space-y-4">
      <Input
        placeholder="Search concepts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-card"
      />
      <div className="space-y-2">
        {filtered.map((node) => (
          <Card key={node.id} className="p-4">
            <p className="font-medium text-sm">{node.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {node.created_at ? new Date(node.created_at).toLocaleDateString() : "No date"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

## API Endpoints Used

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/graph/nodes?profile_id=&limit=` | Fetch all graph nodes + edges |
| GET | `/v1/graph/neighborhood/{node_id}?hops=` | Fetch N-hop subgraph around a node |

## Conflict Node Pulse (CSS)

```css
/* globals.css — conflict node animation */
/* Applied via Tailwind animate-pulse on container */
/* The node itself uses bg-warning (#ffc00d) */
.conflict-node-wrapper {
  animation: pulse 2s ease-in-out infinite;
}
```

## Empty State Pattern

```tsx
// In graph/page.tsx — determines which empty state to show
const { data: jobStatus } = useQuery({
  queryKey: ["jobs", "active"],
  queryFn: () => apiFetch<{ jobs: Job[] }>("/v1/jobs?status=PROCESSING"),
})

const hasSources = data?.sources?.length > 0
const isProcessing = jobStatus?.jobs?.length > 0

if (!hasSources && !isProcessing) {
  // State 2: Empty graph with upload CTA
  return <EmptyGraphState onUpload={() => openIngestionDropzone()} />
}

if (isProcessing) {
  // State 1: Building graph animation
  return <BuildingGraphAnimation />
}

// Otherwise: render GraphExplorer
return <GraphExplorer profileId={profileId} />
```
