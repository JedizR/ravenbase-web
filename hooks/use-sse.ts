"use client"
import { useEffect, useRef, useState } from "react"

export interface SSEState {
  progress: number
  message: string
  entities: string[]
  status: "idle" | "connecting" | "processing" | "complete" | "error"
  retry: (() => void) | null
}

const INITIAL_STATE: SSEState = {
  progress: 0,
  message: "",
  entities: [],
  status: "idle",
  retry: null,
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]
const INACTIVITY_TIMEOUT = 30_000

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
  const retryCountRef = useRef(0)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!url || !token) {
      setState(INITIAL_STATE)
      return
    }

    let mounted = true

    const clearInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
    }

    const resetInactivityTimer = (es: EventSource) => {
      clearInactivityTimer()
      inactivityTimerRef.current = setTimeout(() => {
        if (mounted) {
          es.close()
          setState((prev) => ({
            ...prev,
            status: "error",
            message: "Connection timed out — no data received for 30 seconds",
            retry: connect,
          }))
        }
      }, INACTIVITY_TIMEOUT)
    }

    function connect() {
      if (!mounted) return

      setState((prev) => ({ ...prev, status: "connecting", retry: null }))

      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${url}?token=${encodeURIComponent(token!)}`
      const es = new EventSource(fullUrl)
      esRef.current = es

      resetInactivityTimer(es)

      es.onopen = () => {
        if (mounted) {
          retryCountRef.current = 0
          setState((prev) => ({ ...prev, status: "processing" }))
        }
      }

      es.onmessage = (event: MessageEvent) => {
        resetInactivityTimer(es)
        try {
          const data = JSON.parse(event.data as string) as {
            progress?: number
            progress_pct?: number
            message?: string
            entities?: string[]
            status?: string
          }
          if (mounted) {
            setState((prev) => ({
              ...prev,
              progress: data.progress ?? data.progress_pct ?? prev.progress,
              message: data.message ?? prev.message,
              entities: data.entities ?? prev.entities,
              status:
                data.status === "completed"
                  ? "complete"
                  : data.status === "failed"
                    ? "error"
                    : "processing",
              retry: null,
            }))
          }
          if (data.status === "completed" || data.status === "failed") {
            clearInactivityTimer()
            es.close()
          }
        } catch {
          // Non-JSON event (heartbeat, comment) — ignore
        }
      }

      es.onerror = () => {
        clearInactivityTimer()
        es.close()
        if (!mounted) return

        if (retryCountRef.current < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCountRef.current] ?? 4000
          retryCountRef.current++
          setTimeout(() => {
            if (mounted) connect()
          }, delay)
        } else {
          setState((prev) => ({
            ...prev,
            status: "error",
            message: "Connection lost after multiple retries",
            retry: () => {
              retryCountRef.current = 0
              connect()
            },
          }))
        }
      }
    }

    connect()

    return () => {
      mounted = false
      clearInactivityTimer()
      esRef.current?.close()
      esRef.current = null
    }
  }, [url, token])

  return state
}
