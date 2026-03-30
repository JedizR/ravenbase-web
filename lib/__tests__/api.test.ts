// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

// Dynamic import AFTER mocks are registered
const { apiFetch } = await import("@/lib/api")
const { auth } = await import("@clerk/nextjs/server")
const mockAuth = vi.mocked(auth)

describe("apiFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000"
  })

  it("attaches Authorization: Bearer <token> header", async () => {
    mockAuth.mockResolvedValue({
      getToken: vi.fn().mockResolvedValue("test-jwt"),
    } as unknown as Awaited<ReturnType<typeof auth>>)

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "ok" }),
    })

    await apiFetch("/v1/test")

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/v1/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt",
          "Content-Type": "application/json",
        }),
      }),
    )
  })

  it("throws error.detail.message on non-ok response", async () => {
    mockAuth.mockResolvedValue({
      getToken: vi.fn().mockResolvedValue("test-jwt"),
    } as unknown as Awaited<ReturnType<typeof auth>>)

    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: { message: "Not found" } }),
    })

    await expect(apiFetch("/v1/missing")).rejects.toThrow("Not found")
  })

  it("falls back to 'API error' when detail.message is absent", async () => {
    mockAuth.mockResolvedValue({
      getToken: vi.fn().mockResolvedValue("test-jwt"),
    } as unknown as Awaited<ReturnType<typeof auth>>)

    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    })

    await expect(apiFetch("/v1/missing")).rejects.toThrow("API error")
  })

  it("merges caller init headers and preserves Authorization", async () => {
    mockAuth.mockResolvedValue({
      getToken: vi.fn().mockResolvedValue("test-jwt"),
    } as unknown as Awaited<ReturnType<typeof auth>>)

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await apiFetch("/v1/test", {
      method: "POST",
      headers: { "X-Custom": "yes" },
    })

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }]
    expect(init.headers["X-Custom"]).toBe("yes")
    expect(init.headers["Authorization"]).toBe("Bearer test-jwt")
    expect(init.method).toBe("POST")
  })
})
