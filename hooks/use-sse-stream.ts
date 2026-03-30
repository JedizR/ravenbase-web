"use client"
import { useEffect, useState } from "react"

export type SSEStreamStatus = "idle" | "streaming" | "done" | "error"

export interface SSEStreamState {
  data: string
  status: SSEStreamStatus
}

/**
 * useSSEStream — connect to a Server-Sent Events endpoint for token streaming.
 *
 * Used for Meta-Document generation and Chat responses where tokens arrive
 * one at a time and accumulate into a full text response.
 *
 * @param url Full URL including path (e.g. /v1/metadoc/stream/{job_id}).
 *            Pass null to disconnect and reset state.
 */
export function useSSEStream(url: string | null): SSEStreamState {
  const [state, setState] = useState<SSEStreamState>({
    data: "",
    status: "idle",
  })

  useEffect(() => {
    if (!url) {
      setState({ data: "", status: "idle" })
      return
    }

    setState({ data: "", status: "streaming" })

    const es = new EventSource(url)

    es.onmessage = (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data as string) as {
          type?: string
          content?: string
        }
        if (parsed.type === "token") {
          setState((prev) => ({
            ...prev,
            data: prev.data + (parsed.content ?? ""),
          }))
        }
        if (parsed.type === "done") {
          setState((prev) => ({ ...prev, status: "done" }))
          es.close()
        }
        if (parsed.type === "error") {
          setState((prev) => ({ ...prev, status: "error" }))
          es.close()
        }
      } catch {
        // Non-JSON event — ignore
      }
    }

    es.onerror = () => {
      setState((prev) => ({ ...prev, status: "error" }))
      es.close()
    }

    return () => es.close()
  }, [url])

  return state
}
