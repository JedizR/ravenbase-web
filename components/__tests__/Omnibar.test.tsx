// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent, screen, act } from "@testing-library/react"
import { Omnibar } from "@/components/domain/Omnibar"

const mockProfile = {
  id: "prof-1",
  name: "Work Profile",
  is_default: true,
  color: "#2d4a3e",
}

const mockApiFetch = vi.fn()
const mockRouterPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

vi.mock("@/contexts/ProfileContext", () => ({
  useProfile: vi.fn(() => ({
    profiles: [mockProfile],
    activeProfile: mockProfile,
    setActiveProfile: vi.fn(),
  })),
}))

vi.mock("@/lib/api-client", () => ({
  useApiFetch: vi.fn(() => mockApiFetch),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe("Omnibar /ingest command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiFetch.mockResolvedValue({
      job_id: "job-1",
      source_id: "src-1",
      status: "queued",
    })
  })

  it("calls POST /v1/ingest/text when /ingest text + Enter", async () => {
    render(<Omnibar />)

    // Open the omnibar
    const trigger = screen.getByRole("button", { name: /open command menu/i })
    fireEvent.click(trigger)

    // Type /ingest some text
    const input = screen.getByPlaceholderText(/type \/profile/i)
    fireEvent.change(input, { target: { value: "/ingest I use TypeScript for all projects." } })

    // Press Enter
    fireEvent.keyDown(input, { key: "Enter" })

    // Wait for the async handler
    await act(async () => {})

    // Assert apiFetch was called with correct path and body
    expect(mockApiFetch).toHaveBeenCalledWith("/v1/ingest/text", {
      method: "POST",
      body: JSON.stringify({
        content: "I use TypeScript for all projects.",
        profile_id: "prof-1",
        tags: [],
      }),
    })
  })

  it("shows success toast after successful ingest", async () => {
    const { toast } = await import("sonner")
    render(<Omnibar />)

    const trigger = screen.getByRole("button", { name: /open command menu/i })
    fireEvent.click(trigger)

    const input = screen.getByPlaceholderText(/type \/profile/i)
    fireEvent.change(input, { target: { value: "/ingest Hello world" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await act(async () => {})

    expect(toast.success).toHaveBeenCalledWith("Captured to Work Profile", {
      duration: 3000,
    })
  })

  it("shows error toast when ingest fails", async () => {
    const { toast } = await import("sonner")
    mockApiFetch.mockRejectedValue(new Error("Server error"))

    render(<Omnibar />)

    const trigger = screen.getByRole("button", { name: /open command menu/i })
    fireEvent.click(trigger)

    const input = screen.getByPlaceholderText(/type \/profile/i)
    fireEvent.change(input, { target: { value: "/ingest Test" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await act(async () => {})

    expect(toast.error).toHaveBeenCalledWith("Ingest failed", {
      description: "Server error",
    })
  })

  it("shows info toast when /ingest has no text", async () => {
    const { toast } = await import("sonner")
    render(<Omnibar />)

    const trigger = screen.getByRole("button", { name: /open command menu/i })
    fireEvent.click(trigger)

    const input = screen.getByPlaceholderText(/type \/profile/i)
    fireEvent.change(input, { target: { value: "/ingest" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await act(async () => {})

    expect(toast.info).toHaveBeenCalledWith("Type some text after /ingest")
  })
})

describe("Omnibar stub commands", () => {
  it("shows toast for /search command", async () => {
    const { toast } = await import("sonner")
    render(<Omnibar />)

    const trigger = screen.getByRole("button", { name: /open command menu/i })
    fireEvent.click(trigger)

    const input = screen.getByPlaceholderText(/type \/profile/i)
    fireEvent.change(input, { target: { value: "/search my query" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await act(async () => {})

    expect(toast.info).toHaveBeenCalledWith("Command not yet implemented", {
      duration: 2000,
    })
  })

  it("shows toast for /generate command", async () => {
    const { toast } = await import("sonner")
    render(<Omnibar />)

    const trigger = screen.getByRole("button", { name: /open command menu/i })
    fireEvent.click(trigger)

    const input = screen.getByPlaceholderText(/type \/profile/i)
    fireEvent.change(input, { target: { value: "/generate a summary" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await act(async () => {})

    expect(toast.info).toHaveBeenCalledWith("Command not yet implemented", {
      duration: 2000,
    })
  })
})
