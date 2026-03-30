"use client"
import { useEffect, useRef, useState } from "react"

export interface SSEState {
  progress: number
  message: string
  entities: string[]
  status: "idle" | "connecting" | "processing" | "complete" | "error"
}

const INITIAL_STATE: SSEState = {
  progress: 0,
  message: "",
  entities: [],
  status: "idle",
}

/**
 * useSSE — connect to a Server-Sent Events endpoint for job progress.
 *
 * @param url   Full URL including path (e.g. /v1/ingest/stream/{sourceId}).
 *              Pass null to disable.
 * @param token Clerk JWT. Appended as ?token= query param because EventSource
 *              cannot set custom headers (browser limitation). The backend reads
 *              this via verify_token_query_param dependency.
 */
export function useSSE(url: string | null, token: string | null): SSEState {
  const [state, setState] = useState<SSEState>(INITIAL_STATE)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!url || !token) {
      setState(INITIAL_STATE)
      return
    }

    setState((prev) => ({ ...prev, status: "connecting" }))

    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${url}?token=${encodeURIComponent(token)}`
    const es = new EventSource(fullUrl)
    esRef.current = es

    es.onopen = () => {
      setState((prev) => ({ ...prev, status: "processing" }))
    }

    es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as {
          progress?: number
          progress_pct?: number
          message?: string
          entities?: string[]
          status?: string
        }
        setState((prev) => ({
          progress: data.progress ?? data.progress_pct ?? prev.progress,
          message: data.message ?? prev.message,
          entities: data.entities ?? prev.entities,
          status:
            data.status === "completed"
              ? "complete"
              : data.status === "failed"
                ? "error"
                : "processing",
        }))
        if (data.status === "completed" || data.status === "failed") {
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

    return () => {
      es.close()
      esRef.current = null
    }
  }, [url, token])

  return state
}
