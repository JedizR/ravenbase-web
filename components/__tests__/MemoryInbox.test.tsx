// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryInbox } from "@/components/domain/MemoryInbox"
import type { ConflictResponse } from "@/src/lib/api-client/types.gen"

// ---------------------------------------------------------------------------
// Mock the generated client
// ---------------------------------------------------------------------------
const mockListConflicts = vi.fn()
const mockResolveConflict = vi.fn()
const mockUndoConflict = vi.fn()

vi.mock("@/src/lib/api-client/services.gen", () => ({
  listConflictsV1ConflictsGet: (...args: any[]) => mockListConflicts(...args),
  resolveConflictV1ConflictsConflictIdResolvePost: (...args: any[]) =>
    mockResolveConflict(...args),
  undoResolutionV1ConflictsConflictIdUndoPost: (...args: any[]) =>
    mockUndoConflict(...args),
}))

const mockConflict: ConflictResponse = {
  id: "c1",
  incumbent_content: "I use React for all frontend development",
  challenger_content: "I now exclusively use Vue.js at work",
  ai_classification: "UPDATE",
  ai_proposed_resolution: "Update primary stack to Vue.js",
  confidence_score: 0.94,
  incumbent_source_id: "src1",
  challenger_source_id: "src2",
  status: "pending",
  created_at: "2024-01-01T00:00:00Z",
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return Wrapper
}

describe("MemoryInbox", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListConflicts.mockReset()
    mockResolveConflict.mockReset()
    mockUndoConflict.mockReset()
  })

  describe("Loading state", () => {
    it("shows skeleton while loading", async () => {
      // Never resolve — keeps query in loading state
      mockListConflicts.mockImplementation(
        () => new Promise(() => {}) as any
      )

      const Wrapper = createWrapper()
      render(<MemoryInbox />, { wrapper: Wrapper })

      // Should show skeleton card
      expect(document.querySelector('[class*="rounded-2xl"]')).toBeTruthy()
    })
  })

  describe("Empty state (AC-7)", () => {
    it("test_empty_state — when conflicts.length === 0, empty state renders", async () => {
      mockListConflicts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 50,
        hasMore: false,
      } as any)

      const Wrapper = createWrapper()
      const { container } = render(<MemoryInbox />, { wrapper: Wrapper })

      // Allow async resolution
      await new Promise((r) => setTimeout(r, 100))

      const content = container.textContent ?? ""
      expect(content).toContain("All clear!")
      expect(content).toContain("Your knowledge graph is fully up to date.")
      expect(content).toContain("◆ ALL_CONFLICTS_RESOLVED")
    })
  })

  describe("Conflict card rendering", () => {
    it("test_conflict_card — shows conflict card with correct content when data loads", async () => {
      mockListConflicts.mockResolvedValue({
        items: [mockConflict],
        total: 1,
        page: 1,
        pageSize: 50,
        hasMore: false,
      } as any)

      const Wrapper = createWrapper()
      const { container } = render(<MemoryInbox />, { wrapper: Wrapper })

      // Allow async resolution
      await new Promise((r) => setTimeout(r, 100))

      const content = container.textContent ?? ""
      // Verify conflict data appears
      expect(content).toContain("94% confidence")
      expect(content).toContain("I use React for all frontend development")
      expect(content).toContain("I now exclusively use Vue.js at work")
      // Verify action buttons
      expect(content).toContain("Accept New")
      expect(content).toContain("Keep Old")
      expect(content).toContain("Discuss")
    })
  })

  describe("Error state", () => {
    it("test_error_state — shows error message when query fails", async () => {
      mockListConflicts.mockRejectedValue(new Error("Network error"))

      const Wrapper = createWrapper()
      const { container } = render(<MemoryInbox />, { wrapper: Wrapper })

      // Allow time for error to propagate
      await new Promise((r) => setTimeout(r, 100))

      const content = container.textContent ?? ""
      expect(content).toContain("FETCH_ERROR")
      expect(content).toContain("Could not load conflicts")
    })
  })
})
