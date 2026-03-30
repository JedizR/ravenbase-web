"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { CheckCircle2, XCircle } from "lucide-react"
import { useSSE } from "@/hooks/use-sse"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

interface IngestionProgressProps {
  sourceId: string | null
}

export function IngestionProgress({ sourceId }: IngestionProgressProps) {
  const { getToken } = useAuth()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!sourceId) return
    getToken()
      .then((t) => setToken(t))
      .catch(() => setToken(null))
  }, [sourceId, getToken])

  const url = sourceId ? `/v1/ingest/stream/${sourceId}` : null
  const { progress, message, status } = useSSE(url, token)

  if (!sourceId || status === "idle") {
    return <Skeleton className="h-2 w-full" />
  }

  if (status === "connecting") {
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
      <p className="font-mono text-xs text-muted-foreground">{message}</p>
    </div>
  )
}
