// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryChat } from "@/components/domain/MemoryChat"
import { CitationCard } from "@/components/domain/CitationCard"

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
  useProfile: () => ({ activeProfile: { id: "profile-1" } }),
}))

// ---------------------------------------------------------------------------
// Mock TanStack Query
// ---------------------------------------------------------------------------
const queryClient = { invalidateQueries: vi.fn() }
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: { items: [] }, isLoading: false }),
  useQueryClient: () => queryClient,
}))

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ---------------------------------------------------------------------------
// Mock API client services
// ---------------------------------------------------------------------------
vi.mock("@/src/lib/api-client/services.gen", () => ({
  listSessionsV1ChatSessionsGet: vi.fn().mockResolvedValue({ items: [] }),
  getSessionV1ChatSessionsSessionIdGet: vi.fn().mockResolvedValue({
    id: "sess-1",
    title: "Test session",
    messages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    message_count: 0,
  }),
  deleteSessionV1ChatSessionsSessionIdDelete: vi.fn().mockResolvedValue(undefined),
}))

// ---------------------------------------------------------------------------
// Helper: mock fetch with SSE stream
// ---------------------------------------------------------------------------
function makeSseStreamMock(events: string[]) {
  let idx = 0
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => {
          if (idx < events.length) {
            const chunk = events[idx++]
            return { done: false, value: new TextEncoder().encode(chunk) }
          }
          return { done: true, value: undefined }
        },
      }),
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("MemoryChat", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeSseStreamMock([
          'data:{"type":"session","session_id":"sess-123"}\n',
          'data:{"type":"token","content":"Hello"}\n',
          'data:{"type":"done","citations":[],"credits_consumed":1}\n',
        ])
      )
    )
  })

  it("renders empty state when no messages", () => {
    render(<MemoryChat />)
    const el = screen.queryByText("Ask me anything about your memories.")
    expect(el).not.toBeNull()
  })

  it("Enter sends message and clears input", async () => {
    const user = userEvent.setup()
    render(<MemoryChat />)
    const textarea = screen.getByLabelText("Chat message input") as HTMLTextAreaElement
    await user.type(textarea, "What Python projects have I worked on?")
    expect(textarea.value).toBe("What Python projects have I worked on?")
    await user.keyboard("{Enter}")
    await waitFor(() => {
      expect(textarea.value).toBe("")
    })
  })

  it("Shift+Enter inserts newline instead of sending", async () => {
    const user = userEvent.setup()
    render(<MemoryChat />)
    const textarea = screen.getByLabelText("Chat message input") as HTMLTextAreaElement
    await user.click(textarea)
    await user.keyboard("Line 1{Shift>}{Enter}{/Shift}Line 2")
    expect(textarea.value).toBe("Line 1\nLine 2")
  })

  it("triggers fetch when Enter is pressed", async () => {
    const user = userEvent.setup()
    render(<MemoryChat />)
    const textarea = screen.getByLabelText("Chat message input")
    await user.type(textarea, "Hello world{Enter}")
    await waitFor(
      () => {
        expect(vi.mocked(fetch)).toHaveBeenCalled()
      },
      { timeout: 2000 }
    )
  })

  it("shows upgrade dialog on 402 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      body: null,
    }))
    const user = userEvent.setup()
    render(<MemoryChat />)
    const textarea = screen.getByLabelText("Chat message input")
    await user.type(textarea, "Hello{Enter}")
    await waitFor(
      () => {
        const el = screen.queryByText("Insufficient Credits")
        expect(el).not.toBeNull()
      },
      { timeout: 2000 }
    )
  })
})

describe("CitationCard", () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it("navigates to graph when memory_id is present", () => {
    const citation = {
      memory_id: "mem-123",
      content_preview: "test content",
      source_id: "src-456",
    }
    render(<CitationCard citation={citation} />)
    fireEvent.click(screen.getByText("↗ src-456"))
    expect(mockPush).toHaveBeenCalledWith("/dashboard/graph?node=mem-123")
  })

  it("does not navigate when memory_id is null", () => {
    const citation = {
      memory_id: null,
      content_preview: "test content",
      source_id: "src-456",
    }
    render(<CitationCard citation={citation} />)
    fireEvent.click(screen.getByText("↗ src-456"))
    expect(mockPush).not.toHaveBeenCalled()
  })
})
