// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"

vi.mock("@clerk/nextjs", () => ({
  useAuth: vi.fn(),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const { useApiFetch, useApiUpload } = await import("@/lib/api-client")
const { useAuth } = await import("@clerk/nextjs")
const mockUseAuth = vi.mocked(useAuth)

describe("useApiFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000"
    mockUseAuth.mockReturnValue({
      getToken: vi.fn().mockResolvedValue("client-jwt"),
    } as unknown as ReturnType<typeof useAuth>)
  })

  it("returned function attaches Authorization: Bearer <token>", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    })

    const { result } = renderHook(() => useApiFetch())
    await result.current("/v1/conflicts")

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/v1/conflicts",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer client-jwt",
          "Content-Type": "application/json",
        }),
      }),
    )
  })

  it("throws on non-ok response with detail.message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: { message: "Forbidden" } }),
    })

    const { result } = renderHook(() => useApiFetch())
    await expect(result.current("/v1/protected")).rejects.toThrow("Forbidden")
  })
})

describe("useApiUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000"
    mockUseAuth.mockReturnValue({
      getToken: vi.fn().mockResolvedValue("upload-jwt"),
    } as unknown as ReturnType<typeof useAuth>)
  })

  it("does NOT set Content-Type (lets browser set multipart boundary)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "abc" }),
    })

    const { result } = renderHook(() => useApiUpload())
    const formData = new FormData()
    formData.append("file", new Blob(["content"]), "test.txt")
    await result.current("/v1/ingest/upload", formData)

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }]
    expect(init.headers["Content-Type"]).toBeUndefined()
    expect(init.headers["Authorization"]).toBe("Bearer upload-jwt")
  })
})
