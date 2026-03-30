"use client"
import { useAuth } from "@clerk/nextjs"

export function useApiFetch() {
  const { getToken } = useAuth()

  return async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail?.message ?? "API error")
    }
    return response.json() as Promise<T>
  }
}

export function useApiUpload() {
  const { getToken } = useAuth()

  return async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
    const token = await getToken()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type — browser must set multipart boundary
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail?.message ?? "Upload error")
    }
    return response.json() as Promise<T>
  }
}
