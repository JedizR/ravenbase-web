"use client"
import { useEffect, useRef, useState } from "react"

export type SSEStreamStatus = "idle" | "streaming" | "done" | "error"

export interface SSEStreamState {
  data: string
  status: SSEStreamStatus
  retry: (() => void) | null
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]
const INACTIVITY_TIMEOUT = 30_000

/**
 * useSSEStream — connect to a Server-Sent Events endpoint for token streaming.
 *
 * Used for Meta-Document generation and Chat responses where tokens arrive
 * one at a time and accumulate into a full text response.
 *
 * @param url   Full URL including path (e.g. /v1/metadoc/stream/{job_id}?token=...).
 *              Pass null to disconnect and reset state.
 */
export function useSSEStream(url: string | null): SSEStreamState {
  const [state, setState] = useState<SSEStreamState>({
    data: "",
    status: "idle",
    retry: null,
  })
  const retryCountRef = useRef(0)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!url) {
      setState({ data: "", status: "idle", retry: null })
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
            retry: connect,
          }))
        }
      }, INACTIVITY_TIMEOUT)
    }

    function connect() {
      if (!mounted) return

      setState((prev) => ({
        data: prev.data, // preserve accumulated data across retries
        status: "streaming",
        retry: null,
      }))

      const es = new EventSource(url!)

      resetInactivityTimer(es)

      es.onmessage = (e: MessageEvent) => {
        resetInactivityTimer(es)
        try {
          const parsed = JSON.parse(e.data as string) as {
            type?: string
            content?: string
          }
          if (parsed.type === "token" && mounted) {
            setState((prev) => ({
              ...prev,
              data: prev.data + (parsed.content ?? ""),
            }))
          }
          if (parsed.type === "done" && mounted) {
            clearInactivityTimer()
            setState((prev) => ({ ...prev, status: "done", retry: null }))
            es.close()
          }
          if (parsed.type === "error" && mounted) {
            clearInactivityTimer()
            setState((prev) => ({ ...prev, status: "error", retry: null }))
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
            retry: () => {
              retryCountRef.current = 0
              connect()
            },
          }))
        }
      }
    }

    retryCountRef.current = 0
    connect()

    return () => {
      mounted = false
      clearInactivityTimer()
    }
  }, [url])

  return state
}
