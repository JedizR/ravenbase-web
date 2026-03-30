// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GraphQueryBar } from "@/components/domain/GraphQueryBar"

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
const mockApiFetch = vi.fn()

vi.mock("@/lib/api-client", () => ({
  useApiFetch: () => mockApiFetch,
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockQueryResponse = {
  cypher: "MATCH (m:Memory) RETURN m",
  results: {
    nodes: [
      {
        id: "node-1",
        label: "Test Memory",
        type: "memory",
        properties: {
          content: "This is a test memory content that is quite long.",
          source_name: "test.pdf",
          confidence: 0.94,
        },
      },
    ],
    edges: [],
  },
  explanation: "Found memories matching your query",
  query_time_ms: 42,
}

// ---------------------------------------------------------------------------
// GraphQueryBar tests
// ---------------------------------------------------------------------------
describe("GraphQueryBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("test_enter_key_submits", async () => {
    const user = userEvent.setup()
    mockApiFetch.mockResolvedValue(mockQueryResponse)

    render(<GraphQueryBar onResults={vi.fn()} profileId={null} />)

    const input = screen.getByRole("textbox")
    await user.type(input, "Show my Python projects")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/v1/graph/query",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ query: "Show my Python projects", profile_id: null, limit: 20 }),
        })
      )
    })
  })

  it("test_click_chip_fills_input", async () => {
    const user = userEvent.setup()

    render(<GraphQueryBar onResults={vi.fn()} profileId={null} />)

    const chip = screen.getByText("Show my Python projects")
    await user.click(chip)

    const input = screen.getByRole("textbox")
    expect((input as HTMLInputElement).value).toBe("Show my Python projects")
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it("test_clear_button_appears", () => {
    render(<GraphQueryBar onResults={vi.fn()} profileId={null} />)

    // Type something
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "test query" } })

    expect(screen.getByRole("button", { name: /clear/i })).toBeTruthy()
  })

  it("test_clear_resets_state", async () => {
    const user = userEvent.setup()
    const onResults = vi.fn()

    render(<GraphQueryBar onResults={onResults} profileId={null} />)

    const input = screen.getByRole("textbox")
    await user.type(input, "test query")

    const clearBtn = screen.getByRole("button", { name: /clear/i })
    await user.click(clearBtn)

    expect((input as HTMLInputElement).value).toBe("")
    expect(onResults).toHaveBeenCalledWith(null)
  })

  it("test_error_shows_toast", async () => {
    const user = userEvent.setup()
    mockApiFetch.mockRejectedValue(new Error("Network error"))
    const { toast } = await import("sonner")

    render(<GraphQueryBar onResults={vi.fn()} profileId={null} />)

    const input = screen.getByRole("textbox")
    await user.type(input, "test query")
    const searchBtn = screen.getByRole("button", { name: /search/i })
    await user.click(searchBtn)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Query failed. Try rephrasing.")
    })
  })

  it("test_loading_state", async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: unknown) => void
    mockApiFetch.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve })
    )

    render(<GraphQueryBar onResults={vi.fn()} profileId={null} />)

    const input = screen.getByRole("textbox")
    await user.type(input, "test query")
    const searchBtn = screen.getByRole("button", { name: /search/i })
    await user.click(searchBtn)

    // Button should be disabled during loading
    await waitFor(() => {
      expect((searchBtn as HTMLButtonElement).disabled).toBe(true)
    })

    // Resolve the promise
    resolvePromise!(mockQueryResponse)
  })
})
