// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { GraphQueryResults } from "@/components/domain/GraphQueryResults"

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
          content: "This is a test memory content that is quite long and should be truncated.",
          source_name: "test.pdf",
          confidence: 0.94,
        },
      },
      {
        id: "node-2",
        label: "Another Memory",
        type: "memory",
        properties: {
          content: "Another memory about Python projects.",
          filename: "notes.md",
          confidence: 0.87,
        },
      },
    ],
    edges: [],
  },
  explanation: "Found memories matching your query",
  query_time_ms: 42,
}

const mockQueryResponseEmpty = {
  cypher: "MATCH (m:Memory) RETURN m",
  results: {
    nodes: [],
    edges: [],
  },
  explanation: "No memories found",
  query_time_ms: 12,
}

// ---------------------------------------------------------------------------
// GraphQueryResults tests
// ---------------------------------------------------------------------------
describe("GraphQueryResults", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("test_hidden_when_null", () => {
    const { container } = render(
      <GraphQueryResults queryResults={null} onResultCardClick={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("test_shows_cards", () => {
    render(
      <GraphQueryResults queryResults={mockQueryResponse} onResultCardClick={vi.fn()} />
    )

    // Should show QUERY_RESULTS label
    expect(screen.getByText("◆ QUERY_RESULTS")).toBeTruthy()
    // Should show count using regex (text split across elements)
    expect(screen.getByText(/\d+ found/)).toBeTruthy()
    // Should show both nodes as cards
    expect(screen.getByText(/This is a test memory content/)).toBeTruthy()
    expect(screen.getByText(/Another memory about Python/)).toBeTruthy()
  })

  it("test_empty_state", () => {
    render(
      <GraphQueryResults
        queryResults={mockQueryResponseEmpty}
        onResultCardClick={vi.fn()}
      />
    )

    expect(screen.getByText("No memories found. Try a different question.")).toBeTruthy()
  })

  it("test_card_click_fires_callback", () => {
    const onResultCardClick = vi.fn()
    render(
      <GraphQueryResults
        queryResults={mockQueryResponse}
        onResultCardClick={onResultCardClick}
      />
    )

    // Click the first card
    const cards = screen.getAllByRole("button")
    fireEvent.click(cards[0])

    expect(onResultCardClick).toHaveBeenCalledWith("node-1")
  })

  it("test_show_cypher_expands", () => {
    render(
      <GraphQueryResults queryResults={mockQueryResponse} onResultCardClick={vi.fn()} />
    )

    // Click "Show Cypher" button
    const cypherBtn = screen.getByText("Show Cypher")
    fireEvent.click(cypherBtn)

    // Cypher content should be visible
    expect(screen.getByText(/MATCH \(m:Memory\) RETURN m/)).toBeTruthy()
  })

  it("test_hide_cypher_collapse", () => {
    render(
      <GraphQueryResults queryResults={mockQueryResponse} onResultCardClick={vi.fn()} />
    )

    // Click "Show Cypher" to expand
    const cypherBtn = screen.getByText("Show Cypher")
    fireEvent.click(cypherBtn)

    // Click "Hide Cypher" to collapse
    const hideBtn = screen.getByText("Hide Cypher")
    fireEvent.click(hideBtn)

    // Cypher should no longer be visible
    expect(screen.queryByText(/MATCH \(m:Memory\)/)).toBeNull()
  })
})
