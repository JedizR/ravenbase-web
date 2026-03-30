// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ImportFromAIChat } from "@/components/domain/ImportFromAIChat"

// Use vi.hoisted so mocks are available when vi.mock factories run
const { mockGetImportPrompt, mockIngestText, mockSetActiveProfile, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockGetImportPrompt: vi.fn(),
  mockIngestText: vi.fn(),
  mockSetActiveProfile: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}))

vi.mock("@/src/lib/api-client/services.gen", () => ({
  getImportPromptV1IngestImportPromptGet: mockGetImportPrompt,
  ingestTextV1IngestTextPost: mockIngestText,
}))

vi.mock("@/contexts/ProfileContext", () => ({
  useProfile: () => ({
    profiles: mockProfiles,
    activeProfile: mockProfiles[0],
    setActiveProfile: mockSetActiveProfile,
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}))

vi.mock("@/hooks/use-sse", () => ({
  useSSE: vi.fn(() => ({
    progress: 0,
    message: "",
    entities: [],
    status: "idle",
  })),
}))

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("mock-token") }),
}))

const mockProfiles = [
  {
    id: "profile-1",
    name: "Work",
    description: null,
    icon: null,
    color: null,
    is_default: true,
    created_at: "",
  },
  {
    id: "profile-2",
    name: "Personal",
    description: null,
    icon: null,
    color: null,
    is_default: false,
    created_at: "",
  },
]

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("ImportFromAIChat", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    mockGetImportPrompt.mockResolvedValue({
      prompt_text: "Test extraction prompt",
      detected_concepts: ["TypeScript", "React"],
    })
    mockIngestText.mockResolvedValue({
      source_id: "src-123",
      job_id: "job-456",
    })
  })

  // ── test 1 ──────────────────────────────────────────────────────────────────
  it("test_prompt_loads", async () => {
    render(<ImportFromAIChat />, { wrapper: TestWrapper })
    await waitFor(() => {
      expect(screen.getByLabelText("Generated extraction prompt")).toBeTruthy()
    })
    const textarea = screen.getByLabelText("Generated extraction prompt")
    expect(textarea).toHaveProperty("value", "Test extraction prompt")
  })

  // ── test 2 ──────────────────────────────────────────────────────────────────
  it("test_copy_button", async () => {
    const user = userEvent.setup()
    render(<ImportFromAIChat />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByLabelText("Generated extraction prompt")).toBeTruthy()
    })

    const clipboardWriteText = vi.fn()
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: clipboardWriteText },
      configurable: true,
    })

    const copyBtn = screen.getByRole("button", { name: /copy/i })
    await user.click(copyBtn)

    expect(clipboardWriteText).toHaveBeenCalledWith("Test extraction prompt")
    expect(screen.getByRole("button", { name: /copied/i })).toBeTruthy()
  })

  // ── test 3 ──────────────────────────────────────────────────────────────────
  it("test_submit_calls_ingest", async () => {
    const user = userEvent.setup()
    render(<ImportFromAIChat />, { wrapper: TestWrapper })

    const textarea = screen.getByLabelText(/paste ai response/i)
    await user.type(textarea, "This is a test AI response")

    const importBtn = screen.getByRole("button", { name: "Import" })
    await user.click(importBtn)

    await waitFor(() => {
      expect(mockIngestText).toHaveBeenCalledWith({
        requestBody: {
          content: "This is a test AI response",
          profile_id: "profile-1",
        },
      })
    })
  })

  // ── test 4 ──────────────────────────────────────────────────────────────────
  it("test_empty_submit_shows_error", async () => {
    render(<ImportFromAIChat />, { wrapper: TestWrapper })

    // Verify Import button is disabled when textarea is empty
    const importBtn = screen.getByRole("button", { name: "Import" })
    expect(importBtn).toBeTruthy()
    expect(importBtn.hasAttribute("disabled")).toBe(true)
    // No toast or mutation calls before any interaction
    expect(mockToastError).not.toHaveBeenCalled()
    expect(mockIngestText).not.toHaveBeenCalled()
  })

  // ── test 5 ──────────────────────────────────────────────────────────────────
  it("test_progress_shows_after_success", async () => {
    const user = userEvent.setup()
    render(<ImportFromAIChat />, { wrapper: TestWrapper })

    const textarea = screen.getByLabelText(/paste ai response/i)
    await user.type(textarea, "Test response")

    const importBtn = screen.getByRole("button", { name: "Import" })
    await user.click(importBtn)

    // After mutation success, state becomes "streaming" and IngestionProgress
    // renders instead of the Import button
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Import" })).toBeFalsy()
    })
  })
})
