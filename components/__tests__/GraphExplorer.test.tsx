// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { GraphExplorer } from "@/components/domain/GraphExplorer"
import { GraphEmptyState } from "@/components/domain/GraphEmptyState"
import { ConceptList } from "@/components/domain/ConceptList"

// ---------------------------------------------------------------------------
// Mock Clerk auth
// ---------------------------------------------------------------------------
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("mock-token") }),
}))

// ---------------------------------------------------------------------------
// Mock ProfileContext
// ---------------------------------------------------------------------------
vi.mock("@/contexts/ProfileContext", () => ({
  useProfile: () => ({
    profiles: [],
    activeProfile: { id: "profile-1", name: "Test", description: null, icon: null, color: null, is_default: true, created_at: "" },
    setActiveProfile: vi.fn(),
    isLoading: false,
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    refetchProfiles: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Mock TanStack Query
// ---------------------------------------------------------------------------
const mockQueryClient = { invalidateQueries: vi.fn() }
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useQueryClient: () => mockQueryClient,
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
const mockNodes = [
  { id: "node-1", label: "Concept 1", type: "concept", properties: {}, memory_count: 5 },
  { id: "node-2", label: "Memory 1", type: "memory", properties: {}, memory_count: 2 },
  { id: "node-3", label: "Source 1", type: "source", properties: {}, memory_count: 0 },
  { id: "node-4", label: "Conflict 1", type: "conflict", properties: {} },
]

const mockEdges = [
  { source: "node-1", target: "node-2", type: "relates_to" },
  { source: "node-2", target: "node-3", type: "derived_from" },
]

// ---------------------------------------------------------------------------
// GraphEmptyState tests
// ---------------------------------------------------------------------------
describe("GraphEmptyState", () => {
  it("renders processing state when isProcessing is true", () => {
    render(<GraphEmptyState isProcessing={true} hasSources={true} />)
    expect(screen.getByText("Processing your sources...")).toBeTruthy()
    expect(screen.getByText("◆ PROCESSING")).toBeTruthy()
  })

  it("renders empty state when hasSources is false", () => {
    render(<GraphEmptyState isProcessing={false} hasSources={false} />)
    expect(screen.getByText("Your knowledge graph is empty")).toBeTruthy()
    expect(screen.getByText("Upload Files")).toBeTruthy()
  })

  it("renders no matching nodes when filters applied", () => {
    const onClearFilters = vi.fn()
    render(
      <GraphEmptyState
        isProcessing={false}
        hasSources={true}
        onClearFilters={onClearFilters}
      />
    )
    expect(screen.getByText("No matching nodes")).toBeTruthy()
    expect(screen.getByText("Clear Filters")).toBeTruthy()
  })

  it("calls onClearFilters when Clear Filters is clicked", () => {
    const onClearFilters = vi.fn()
    render(
      <GraphEmptyState
        isProcessing={false}
        hasSources={true}
        onClearFilters={onClearFilters}
      />
    )
    fireEvent.click(screen.getByText("Clear Filters"))
    expect(onClearFilters).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// ConceptList tests
// ---------------------------------------------------------------------------
describe("ConceptList", () => {
  it("renders loading skeleton when isLoading is true", () => {
    render(<ConceptList nodes={[]} isLoading={true} onNodeSelect={vi.fn()} />)
    // Should show skeleton elements (multiple Skeleton components)
    const skeletons = document.querySelectorAll("[class*='animate-pulse']")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders empty state when no nodes", () => {
    render(<ConceptList nodes={[]} isLoading={false} onNodeSelect={vi.fn()} />)
    expect(screen.getByText("No concepts found.")).toBeTruthy()
  })

  it("renders nodes correctly", () => {
    render(
      <ConceptList
        nodes={mockNodes}
        isLoading={false}
        onNodeSelect={vi.fn()}
      />
    )
    expect(screen.getByText("Concept 1")).toBeTruthy()
    expect(screen.getByText("Memory 1")).toBeTruthy()
    expect(screen.getByText("Source 1")).toBeTruthy()
  })

  it("filters nodes by search query", () => {
    render(
      <ConceptList
        nodes={mockNodes}
        isLoading={false}
        onNodeSelect={vi.fn()}
      />
    )
    const searchInput = screen.getByPlaceholderText("Search concepts...")
    fireEvent.change(searchInput, { target: { value: "Concept" } })
    expect(screen.getByText("Concept 1")).toBeTruthy()
    expect(screen.queryByText("Memory 1")).toBeNull()
  })

  it("calls onNodeSelect when node is clicked", () => {
    const onNodeSelect = vi.fn()
    render(
      <ConceptList
        nodes={mockNodes}
        isLoading={false}
        onNodeSelect={onNodeSelect}
      />
    )
    fireEvent.click(screen.getByText("Concept 1"))
    expect(onNodeSelect).toHaveBeenCalledWith("node-1")
  })

  it("shows memory count for nodes with memories", () => {
    render(
      <ConceptList
        nodes={mockNodes}
        isLoading={false}
        onNodeSelect={vi.fn()}
      />
    )
    expect(screen.getByText("5 memories")).toBeTruthy()
    expect(screen.getByText("2 memories")).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// GraphExplorer tests
// ---------------------------------------------------------------------------
describe("GraphExplorer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading skeleton when isLoading is true", () => {
    render(
      <GraphExplorer
        nodes={[]}
        edges={[]}
        isLoading={true}
        error={null}
        onNodeSelect={vi.fn()}
      />
    )
    // The GraphExplorer shows a skeleton during loading
    const container = document.querySelector("[class*='rounded-2xl']")
    expect(container).toBeTruthy()
  })

  it("renders error state when error is present", () => {
    render(
      <GraphExplorer
        nodes={[]}
        edges={[]}
        isLoading={false}
        error="Failed to load graph"
        onNodeSelect={vi.fn()}
      />
    )
    expect(screen.getByText("Failed to load graph")).toBeTruthy()
  })

  it("renders empty container when no nodes and no loading", () => {
    render(
      <GraphExplorer
        nodes={[]}
        edges={[]}
        isLoading={false}
        error={null}
        onNodeSelect={vi.fn()}
      />
    )
    // The container should be rendered
    const container = document.querySelector("[aria-label='Knowledge graph visualization']")
    expect(container).toBeTruthy()
  })
})
