"use client"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import {
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useProfile } from "@/contexts/ProfileContext"
import { useSSEStream } from "@/hooks/use-sse-stream"
import { generateMetaDocumentV1MetadocGeneratePost } from "@/src/lib/api-client/services.gen"
import remarkGfm from "remark-gfm"

// Dynamic import for react-markdown (heavy, no SSR)
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
})

// Save status states per RULE 19
type SaveStatus =
  | "idle"
  | "generating"
  | "saved_just_now"
  | "saved_2_min_ago"
  | "unsaved_changes"

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: "",
  generating: "◆ GENERATING",
  saved_just_now: "◆ SAVED_JUST_NOW",
  saved_2_min_ago: "◆ SAVED_2_MIN_AGO",
  unsaved_changes: "◆ UNSAVED_CHANGES",
}

export interface MetaDocEditorState {
  content: string
  prompt: string
  isStreaming: boolean
  activeDocId: string | null
  contributingCount: number | null
}

interface MetaDocEditorProps {
  initialContent?: string
  initialPrompt?: string
  initialDocId?: string | null
  onContentChange?: (content: string) => void
  onStreamingStart?: () => void
  onStreamingEnd?: (content: string, docId: string | null) => void
  onContributingCountChange?: (count: number | null) => void
}

export function MetaDocEditor({
  initialContent = "",
  initialPrompt = "",
  initialDocId = null,
  onContentChange,
  onStreamingStart,
  onStreamingEnd,
  onContributingCountChange,
}: MetaDocEditorProps) {
  const { getToken } = useAuth()
  const { activeProfile } = useProfile()

  // Prompt input
  const [prompt, setPrompt] = useState(initialPrompt)
  const [selectedModel, setSelectedModel] = useState<"haiku" | "sonnet">("sonnet")

  // Streaming state
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const { data: streamedContent, status } = useSSEStream(streamUrl)
  const isStreaming = status === "streaming"

  // Document state
  const [content, setContent] = useState(initialContent)
  const [activeDocId, setActiveDocId] = useState<string | null>(initialDocId)
  const [contributingCount, setContributingCount] = useState<number | null>(null)

  // Sources panel
  const [showSources, setShowSources] = useState(false)

  // Save status (RULE 19)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Content ref for scrolling
  const contentRef = useRef<HTMLDivElement>(null)

  // Sync initial values
  useEffect(() => {
    setContent(initialContent)
    setPrompt(initialPrompt)
    setActiveDocId(initialDocId)
  }, [initialContent, initialPrompt, initialDocId])

  // Draft recovery on mount — check localStorage for unsaved content
  useEffect(() => {
    if (initialDocId) {
      const draftKey = `ravenbase-draft-${initialDocId}`
      try {
        const draft = localStorage.getItem(draftKey)
        if (draft) {
          const parsed = JSON.parse(draft) as { content: string; timestamp: number }
          // Only restore if draft is newer than 24 hours
          if (Date.now() - parsed.timestamp < 86_400_000 && parsed.content) {
            setContent(parsed.content)
            setSaveStatus("unsaved_changes")
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [initialDocId])

  // Auto-save to localStorage every 30 seconds (RULE 19 — real implementation)
  useEffect(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)

    autoSaveTimerRef.current = setInterval(() => {
      if (content && activeDocId) {
        try {
          localStorage.setItem(
            `ravenbase-draft-${activeDocId}`,
            JSON.stringify({ content, timestamp: Date.now() })
          )
          setSaveStatus((prev) =>
            prev === "generating" ? prev : "saved_just_now"
          )
        } catch {
          // localStorage full or unavailable — ignore
        }
      }
    }, 30_000)

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    }
  }, [content, activeDocId])

  // Update save status timer
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (saveStatus === "saved_just_now") {
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus("saved_2_min_ago")
      }, 120_000) // 2 minutes
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [saveStatus])

  // Scroll to bottom while streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [streamedContent, isStreaming])

  // Update content from SSE
  useEffect(() => {
    if (status === "streaming") {
      const newContent = streamedContent
      setContent(newContent)
      onContentChange?.(newContent)
    } else if (status === "done") {
      const finalContent = streamedContent
      setContent(finalContent)
      setSaveStatus("saved_just_now")
      onContentChange?.(finalContent)
      onStreamingEnd?.(finalContent, activeDocId)
    } else if (status === "error") {
      setSaveStatus("unsaved_changes")
    }
  }, [status, streamedContent, activeDocId, onContentChange, onStreamingEnd])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isStreaming) return

    try {
      onStreamingStart?.()

      const res = await generateMetaDocumentV1MetadocGeneratePost({
        requestBody: {
          prompt: prompt.trim(),
          model: selectedModel,
          profile_id: activeProfile?.id
            ? (activeProfile.id as string)
            : undefined,
        },
      })

      const token = await getToken()
      if (!token) {
        setSaveStatus("unsaved_changes")
        return
      }
      const jobId = encodeURIComponent(res.job_id)
      const esUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/metadoc/stream/${jobId}?token=${encodeURIComponent(token)}`

      const tempId = `temp_${Date.now()}`
      setActiveDocId(tempId)
      setContent("")
      setContributingCount(null)
      setSaveStatus("generating")
      setStreamUrl(esUrl)
    } catch (err) {
      console.error("Generation failed:", err)
      setSaveStatus("unsaved_changes")
    }
  }, [prompt, selectedModel, activeProfile, getToken, isStreaming, onStreamingStart])

  const handleExportMarkdown = useCallback(() => {
    if (!content) return
    const blob = new Blob([content], {
      type: "text/markdown;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meta-doc-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [content])

  const handleExportPDF = useCallback(() => {
    window.print()
  }, [])

  const handleRegenerate = useCallback(() => {
    if (!prompt.trim()) return
    handleGenerate()
  }, [prompt, handleGenerate])

  // Clear localStorage draft when generation completes successfully
  useEffect(() => {
    if (status === "done" && activeDocId) {
      try {
        localStorage.removeItem(`ravenbase-draft-${activeDocId}`)
      } catch {
        // Ignore
      }
    }
  }, [status, activeDocId])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border no-print">
        <div className="flex items-center gap-2">
          {/* Save status */}
          {saveStatus !== "idle" && (
            <span className="font-mono text-xs text-muted-foreground">
              {SAVE_STATUS_LABELS[saveStatus]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Sources button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSources(true)}
            className="hidden md:flex"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Sources {!contributingCount ? null : `(${contributingCount})`}
          </Button>

          {/* Export Markdown */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMarkdown}
            disabled={!content}
          >
            <Download className="w-3 h-3 mr-1" />
            MD
          </Button>

          {/* Export PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={!content}
          >
            <Printer className="w-3 h-3 mr-1" />
            PDF
          </Button>

          {/* Regenerate */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={!prompt.trim() || isStreaming}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Editor content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto p-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {content ? (
          <article className="prose prose-sm max-w-none font-sans">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {isStreaming ? content + "▌" : content}
            </ReactMarkdown>
          </article>
        ) : isStreaming ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No document yet</p>
            <p className="text-xs mt-1">
              Enter a prompt below to generate your first Meta-Document
            </p>
          </div>
        )}
      </div>

      {/* Prompt input — sticky bottom */}
      <div
        className="p-4 border-t border-border bg-background no-print"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" } as React.CSSProperties}
      >
        {/* Mobile model + generate row */}
        <div className="flex md:hidden items-center gap-2 mb-2">
          <Select
            value={selectedModel}
            onValueChange={(v) => setSelectedModel(v as "haiku" | "sonnet")}
          >
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sonnet">Sonnet</SelectItem>
              <SelectItem value="haiku">Haiku</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="flex-1 h-8"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isStreaming}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Prompt area — no form tag */}
        <div className="flex flex-col gap-2">
          {/* Desktop: model selector */}
          <div className="hidden md:flex items-center gap-2">
            <Select
              value={selectedModel}
              onValueChange={(v) => setSelectedModel(v as "haiku" | "sonnet")}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sonnet">Sonnet</SelectItem>
                <SelectItem value="haiku">Haiku</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground font-mono">
              ◆ GENERATE
            </span>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Generate a 1-page resume tailored for a Senior Full-Stack Next.js role..."
            className="min-h-[80px] resize-none"
            aria-label="Meta-Document prompt"
          />
          <Button
            className="w-full rounded-full hidden md:flex"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isStreaming}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sources sheet (mobile) */}
      <Sheet open={showSources} onOpenChange={setShowSources}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="font-mono text-xs tracking-wider">
              ◆ KNOWLEDGE_INDEX
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {contributingCount !== null ? (
              <p className="text-sm text-muted-foreground">
                This document was generated from {contributingCount} contributing
                memory nodes.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Generate a document to see which memory nodes contributed.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
