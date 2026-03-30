// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { GraphNodePanel } from "@/components/domain/GraphNodePanel"

// ---------------------------------------------------------------------------
// Mock Clerk auth
// ---------------------------------------------------------------------------
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("mock-token") }),
}))

// ---------------------------------------------------------------------------
// Mock TanStack Query
// ---------------------------------------------------------------------------
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockNode = {
  id: "node-1",
  label: "Test Concept",
  type: "concept",
  properties: {
    created_at: "2024-01-01T00:00:00Z",
    source_filename: "test.pdf",
  },
}

const mockNeighborhoodData = {
  nodes: [
    mockNode,
    { id: "node-2", label: "Related Memory", type: "memory", properties: {} },
    { id: "node-3", label: "Another Concept", type: "concept", properties: {} },
  ],
  edges: [
    { source: "node-1", target: "node-2", type: "relates_to" },
  ],
}

const mockConflictNode = {
  id: "conflict-1",
  label: "Test Conflict",
  type: "conflict",
  properties: {
    created_at: "2024-01-01T00:00:00Z",
  },
}

// ---------------------------------------------------------------------------
// GraphNodePanel tests
// ---------------------------------------------------------------------------
describe("GraphNodePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows loading skeleton when loading neighborhood data", async () => {
    const { useQuery } = await import("@tanstack/react-query")
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useQuery>)

    render(
      <GraphNodePanel
        selectedNodeId="node-1"
        isOpen={true}
        onClose={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    )

    // Should show loading skeleton
    const skeletons = document.querySelectorAll("[class*='animate-pulse']")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders node details when data is loaded", async () => {
    const { useQuery } = await import("@tanstack/react-query")
    vi.mocked(useQuery).mockReturnValue({
      data: mockNeighborhoodData,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>)

    render(
      <GraphNodePanel
        selectedNodeId="node-1"
        isOpen={true}
        onClose={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("Test Concept")).toBeTruthy()
    })
  })

  it("shows CONCEPT badge for concept nodes", async () => {
    const { useQuery } = await import("@tanstack/react-query")
    vi.mocked(useQuery).mockReturnValue({
      data: mockNeighborhoodData,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>)

    render(
      <GraphNodePanel
        selectedNodeId="node-1"
        isOpen={true}
        onClose={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByText("◆ CONCEPT").length).toBeGreaterThan(0)
    })
  })

  it("shows CONFLICT badge for conflict nodes with pulse animation", async () => {
    const conflictNeighborhood = {
      nodes: [mockConflictNode],
      edges: [],
    }

    const { useQuery } = await import("@tanstack/react-query")
    vi.mocked(useQuery).mockReturnValue({
      data: conflictNeighborhood,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>)

    render(
      <GraphNodePanel
        selectedNodeId="conflict-1"
        isOpen={true}
        onClose={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    )

    await waitFor(() => {
      const badge = screen.getByText("◆ CONFLICT")
      expect(badge).toBeTruthy()
      // Check for animate-pulse class
      expect(badge.className).toContain("animate-pulse")
    })
  })

  it("shows View in Inbox button for conflict nodes", async () => {
    const conflictNeighborhood = {
      nodes: [mockConflictNode],
      edges: [],
    }

    const { useQuery } = await import("@tanstack/react-query")
    vi.mocked(useQuery).mockReturnValue({
      data: conflictNeighborhood,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>)

    render(
      <GraphNodePanel
        selectedNodeId="conflict-1"
        isOpen={true}
        onClose={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("View in Inbox")).toBeTruthy()
    })
  })

  it("shows error state when fetch fails", async () => {
    const { useQuery } = await import("@tanstack/react-query")
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Failed to fetch"),
    } as ReturnType<typeof useQuery>)

    render(
      <GraphNodePanel
        selectedNodeId="node-1"
        isOpen={true}
        onClose={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("Could not load node details. Try again.")).toBeTruthy()
    })
  })

  it("renders connected nodes section", async () => {
    const { useQuery } = await import("@tanstack/react-query")
    vi.mocked(useQuery).mockReturnValue({
      data: mockNeighborhoodData,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>)

    render(
      <GraphNodePanel
        selectedNodeId="node-1"
        isOpen={true}
        onClose={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("◆ CONNECTED NODES (2)")).toBeTruthy()
      expect(screen.getByText("Related Memory")).toBeTruthy()
    })
  })

  it("renders MEMORY badge for memory type", async () => {
    const memoryNode = {
      id: "memory-1",
      label: "Test Memory",
      type: "memory",
      properties: {},
    }
    const memoryNeighborhood = {
      nodes: [memoryNode],
      edges: [],
    }

    const { useQuery } = await import("@tanstack/react-query")
    vi.mocked(useQuery).mockReturnValue({
      data: memoryNeighborhood,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>)

    render(
      <GraphNodePanel
        selectedNodeId="memory-1"
        isOpen={true}
        onClose={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("◆ MEMORY")).toBeTruthy()
    })
  })

  it("renders SOURCE badge for source type", async () => {
    const sourceNode = {
      id: "source-1",
      label: "Test Source",
      type: "source",
      properties: {},
    }
    const sourceNeighborhood = {
      nodes: [sourceNode],
      edges: [],
    }

    const { useQuery } = await import("@tanstack/react-query")
    vi.mocked(useQuery).mockReturnValue({
      data: sourceNeighborhood,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>)

    render(
      <GraphNodePanel
        selectedNodeId="source-1"
        isOpen={true}
        onClose={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("◆ SOURCE")).toBeTruthy()
    })
  })
})
