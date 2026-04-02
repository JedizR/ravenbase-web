"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { useSSE } from "@/hooks/use-sse"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface IngestionProgressProps {
  sourceId: string | null
}

export function IngestionProgress({ sourceId }: IngestionProgressProps) {
  const { getToken } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [tokenReady, setTokenReady] = useState(false)

  useEffect(() => {
    if (!sourceId) {
      setToken(null)
      setTokenReady(false)
      return
    }
    setTokenReady(false)
    getToken()
      .then((t) => {
        setToken(t)
        setTokenReady(true)
      })
      .catch(() => {
        setToken(null)
        setTokenReady(true)
      })
  }, [sourceId, getToken])

  // Only start SSE after token is ready to avoid race condition
  const url = sourceId && tokenReady ? `/v1/ingest/stream/${sourceId}` : null
  const { progress, message, status, retry } = useSSE(url, token)

  if (!sourceId || status === "idle") {
    return <Skeleton className="h-2 w-full" />
  }

  if (status === "connecting" || !tokenReady) {
    return <Skeleton className="h-2 w-full" />
  }

  const isComplete = status === "complete"
  const isError = status === "error"

  return (
    <div className="space-y-2" aria-live="polite" aria-atomic="false">
      <div className="flex items-center justify-between">
        <Progress
          value={progress}
          className={
            isComplete
              ? "[&_[data-slot=progress-indicator]]:bg-success"
              : isError
                ? "[&_[data-slot=progress-indicator]]:bg-destructive"
                : undefined
          }
        />
        {isComplete && (
          <CheckCircle2 className="ml-2 h-4 w-4 shrink-0 text-success" />
        )}
        {isError && (
          <XCircle className="ml-2 h-4 w-4 shrink-0 text-destructive" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">
          {message || (isError ? "Processing failed. Please try again." : "")}
        </p>
        {isError && retry && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={retry}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
