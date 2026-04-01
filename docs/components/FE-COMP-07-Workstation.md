# Workstation

> **Component ID:** FE-COMP-07
> **Epic:** EPIC-05 — Meta-Document Generation
> **Stories:** STORY-017
> **Type:** Frontend (Dashboard)

---

## Goal

The Workstation is the dedicated workspace for generating, viewing, and exporting Meta-Documents. It provides a split-panel layout (document history sidebar + editor), a real-time streaming Markdown editor that renders tokens as they arrive via SSE, and export functionality (Markdown file download, PDF via browser print). It is the primary output surface for Ravenbase's generative AI capabilities.

---

## Product Requirements

1. **Route:** Accessible at `/dashboard/workstation`. Two-panel layout on desktop: history sidebar (left) + editor (right). On mobile (< 768px): history hidden by default, accessible via bottom Sheet.

2. **Prompt Input:** Fixed at bottom of the editor area. Controlled `<textarea>` with a "Generate" button (no `<form>` tags). On submit, calls `POST /v1/metadoc/generate` to get `job_id`, then opens SSE stream.

3. **SSE Streaming:** `EventSource` connects to `/api/v1/metadoc/stream/{job_id}?token={clerk_token}`. Tokens stream in and render as Markdown in real-time using `react-markdown` + `remark-gfm`. Streaming status shown in editor header.

4. **Streaming Indicator:** Shows `◆ GENERATING...` while streaming. Shows `◆ SAVED` after completion with auto-save confirmation.

5. **Export as Markdown:** "Export" button creates a `Blob` with `text/markdown` and triggers anchor download. Filename: `meta-doc-{timestamp}.md`.

6. **Export as PDF:** "Print" button calls `window.print()` with `@media print` CSS that hides navigation chrome and formats for A4.

7. **Document History Panel:** Left sidebar lists all previous Meta-Docs for the active profile. Click to load into editor. Each item shows: title (first line of doc), created date. Sorted by most recent first.

8. **Sources Panel:** "Sources" button shows which Memory nodes contributed to the current document — links to Graph Explorer nodes. Fetches from `GET /v1/metadoc/{id}/sources`.

9. **Mobile Layout (< 768px):** History sidebar hidden. Sticky prompt input at bottom with `pb-[max(1rem,env(safe-area-inset-bottom))]`. "History" button in header opens a shadcn `Sheet` from the bottom.

10. **Auto-Save:** Document auto-saves to localStorage every 30 seconds while editing. Shows `◆ SAVED_JUST_NOW` → `◆ SAVED_2_MIN_AGO` → `◆ UNSAVED_CHANGES` (on write failure) in editor header per RULE-19.

11. **Active Profile Context:** Meta-Docs are scoped to `activeProfile.id`. Switching profile via Omnibar refetches history.

12. **aria-live Region:** Streaming content wrapped in `aria-live="polite"` for screen reader announcements.

---

## Criteria and Tests

| Criterion | Test |
|---|---|
| Workstation renders at /dashboard/workstation | Navigate → two-panel layout visible |
| Prompt submit triggers generation | Type prompt + click Generate → job_id returned, SSE stream opens |
| Markdown streams in real-time | Tokens appear in editor as they arrive, not all at once |
| react-markdown renders correctly | **bold**, `code`, lists, blockquotes all render formatted |
| Export as Markdown downloads .md file | Click Export → file downloads with correct content |
| Export as PDF opens print dialog | Click Print → browser print dialog opens |
| History panel lists previous docs | Previous Meta-Docs appear in left sidebar |
| Click history item loads doc | Click a history item → content loads in editor |
| Sources button shows contributing memories | Click Sources → panel shows Graph Explorer links |
| Mobile: history in bottom Sheet | Resize to 375px → History button opens Sheet |
| Mobile: prompt sticky at bottom | Resize to 375px → prompt input sticky with safe-area padding |
| Streaming shows ◆ GENERATING indicator | Start generation → header shows streaming status |
| Auto-save saves to localStorage | Edit doc → wait 30s → localStorage updated |
| ◆ SAVED_JUST_NOW / UNSAVED_CHANGES indicator | See save status in editor header |
| Active profile change refetches history | Switch profile in Omnibar → history panel updates |

---

## Related Stories

| Story | Title | Type | Description |
|---|---|---|---|
| [STORY-017](docs/stories/EPIC-05-metadoc/STORY-017.md) | Workstation UI (Streaming + Markdown + Export) | Frontend | Full Workstation implementation |
| [STORY-016](docs/stories/EPIC-05-metadoc/STORY-016.md) | Meta-Doc Generation Pipeline | Backend | SSE streaming + generation API |

---

## Component Files

```
components/domain/
  Workstation.tsx        — Main layout (history panel + editor + prompt)
  MetaDocEditor.tsx     — SSE stream consumer + Markdown renderer
  MetaDocHistory.tsx    — Left panel, document list
  SourcesPanel.tsx      — Slide-over showing contributing memories
  PromptInput.tsx       — Bottom prompt textarea + Generate button
  SaveStatus.tsx        — ◆ SAVED_JUST_NOW / UNSAVED_CHANGES indicator

hooks/
  use-sse.ts            — Reusable SSE hook (also used in IngestionProgress)
  use-autosave.ts       — Auto-save to localStorage every 30s
  use-document-history.ts — TanStack Query wrapper for Meta-Doc list

app/(dashboard)/workstation/
  page.tsx              — Page composing Workstation component
  loading.tsx           — Skeleton loading state
```

## useSSE Hook (Reusable)

```tsx
// hooks/use-sse.ts
"use client"
import { useEffect, useState } from "react"

type SSEStatus = "idle" | "streaming" | "done" | "error"

export function useSSE(url: string | null) {
  const [data, setData] = useState("")
  const [status, setStatus] = useState<SSEStatus>("idle")

  useEffect(() => {
    if (!url) return
    setData("")
    setStatus("streaming")

    const es = new EventSource(url)

    es.onmessage = (e) => {
      const parsed = JSON.parse(e.data)
      if (parsed.type === "token") {
        setData((prev) => prev + parsed.content)
      }
      if (parsed.type === "done") {
        setStatus("done")
        es.close()
      }
      if (parsed.type === "error") {
        setStatus("error")
        es.close()
      }
    }

    es.onerror = () => {
      setStatus("error")
      es.close()
    }

    return () => es.close()
  }, [url])

  return { data, status }
}
```

## MetaDocEditor Pattern

```tsx
// components/domain/MetaDocEditor.tsx
"use client"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useSSE } from "@/hooks/use-sse"
import { useApiFetch } from "@/lib/api-client"
import { useAuth } from "@clerk/nextjs"
import { SaveStatus } from "./SaveStatus"

interface MetaDocEditorProps {
  docId: string | null
  profileId: string
  onSourceClick: (nodeId: string) => void
}

export function MetaDocEditor({ docId, profileId, onSourceClick }: MetaDocEditorProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const { getToken } = useAuth()
  const apiFetch = useApiFetch()
  const { data: streamedContent, status } = useSSE(streamUrl)

  // Load existing doc when docId changes
  useEffect(() => {
    if (!docId) return
    apiFetch<{ content: string }>(`/v1/metadoc/${docId}`).then((d) => setContent(d.content))
  }, [docId])

  const handleGenerate = async (prompt: string) => {
    const { job_id } = await apiFetch<{ job_id: string }>("/v1/metadoc/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, profile_id: profileId }),
    })
    const token = await getToken()
    setStreamUrl(`/api/v1/metadoc/stream/${job_id}?token=${token}`)
  }

  const displayContent = streamUrl ? streamedContent : content

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-border">
        <SaveStatus lastSaved={lastSaved} hasError={status === "error"} />
        <div className="flex gap-2">
          <SourcesPanel docId={docId} onNodeClick={onSourceClick} />
          <Button size="sm" variant="outline" onClick={handleExportMarkdown}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Markdown content — streaming and static */}
      <div className="flex-1 overflow-y-auto p-6">
        {status === "streaming" && (
          <div className="mb-4">
            <span className="font-mono text-xs text-muted-foreground animate-pulse">
              ◆ GENERATING...
            </span>
          </div>
        )}
        <article
          aria-live="polite"
          aria-atomic="false"
          className="prose prose-sm max-w-none"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayContent}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
```

## Prompt Input Pattern

```tsx
// components/domain/PromptInput.tsx
"use client"
import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface PromptInputProps {
  onSubmit: (prompt: string) => Promise<void>
  disabled?: boolean
}

export function PromptInput({ onSubmit, disabled }: PromptInputProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return
    setIsLoading(true)
    try {
      await onSubmit(prompt.trim())
      setPrompt("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2 p-4 border-t border-border bg-background">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        placeholder="Ask Ravenbase to synthesize your memories..."
        className="min-h-[44px] max-h-[200px] resize-none"
        rows={1}
        disabled={disabled}
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={!prompt.trim() || isLoading || disabled}
        className="h-[44px] w-[44px] shrink-0"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
}
```

## MetaDocHistory Pattern

```tsx
// components/domain/MetaDocHistory.tsx
"use client"
import { useQuery } from "@tanstack/react-query"
import { useApiFetch } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText } from "lucide-react"

interface MetaDocHistoryProps {
  profileId: string
  activeDocId: string | null
  onSelect: (docId: string) => void
}

export function MetaDocHistory({ profileId, activeDocId, onSelect }: MetaDocHistoryProps) {
  const apiFetch = useApiFetch()

  const { data: docs, isLoading } = useQuery({
    queryKey: ["metadocs", profileId],
    queryFn: () => apiFetch<{ documents: MetaDoc[] }>("/v1/metadoc"),
    staleTime: 30_000,
  })

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-serif text-sm">Documents</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full mb-2 rounded-lg" />
          ))
        )}
        {docs?.documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={`
              w-full text-left p-3 rounded-lg mb-1 transition-colors
              ${doc.id === activeDocId ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary"}
            `}
          >
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </button>
        ))}
        {docs?.documents.length === 0 && (
          <p className="text-sm text-muted-foreground p-4 text-center">
            No documents yet. Generate your first above.
          </p>
        )}
      </div>
    </aside>
  )
}
```

## Export Pattern

```tsx
// Export as Markdown
const handleExportMarkdown = (content: string, title?: string) => {
  const filename = title
    ? `${title.toLowerCase().replace(/\s+/g, "-")}.md`
    : `meta-doc-${Date.now()}.md`
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Print CSS — add to globals.css or inline
// @media print { hide nav, show A4 layout }
```

## Auto-Save Pattern

```tsx
// hooks/use-autosave.ts
"use client"
import { useEffect, useRef, useState } from "react"

type SaveStatus = "saved_just_now" | "saved_2_min_ago" | "unsaved_changes"

export function useAutosave(content: string, key: string, intervalMs = 30_000) {
  const [status, setStatus] = useState<SaveStatus>("saved_just_now")
  const lastSavedRef = useRef<string>("")
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (content !== lastSavedRef.current) {
        localStorage.setItem(key, content)
        lastSavedRef.current = content
        setStatus("saved_just_now")
        setTimeout(() => setStatus("saved_2_min_ago"), 2 * 60 * 1000)
      }
    }, intervalMs)

    return () => clearInterval(timerRef.current)
  }, [content, key, intervalMs])

  return status
}
```

## API Endpoints Used

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/metadoc/generate` | Enqueue Meta-Doc generation, returns job_id |
| GET | `/api/v1/metadoc/stream/{job_id}` | SSE stream of generated tokens |
| GET | `/v1/metadoc` | List all Meta-Docs for active profile |
| GET | `/v1/metadoc/{id}` | Fetch single Meta-Doc content |
| GET | `/v1/metadoc/{id}/sources` | Fetch contributing Memory nodes |

## Mobile Layout

```tsx
// app/(dashboard)/workstation/page.tsx
<div className="flex h-[100dvh]">
  {/* Desktop: history sidebar */}
  <aside className="hidden md:flex w-64 flex-col border-r border-border">
    <MetaDocHistory profileId={profileId} activeDocId={activeDocId} onSelect={setActiveDocId} />
  </aside>

  {/* Editor area */}
  <main className="flex-1 flex flex-col min-w-0">
    <MetaDocEditor docId={activeDocId} profileId={profileId} onSourceClick={openGraphNode} />

    {/* Prompt — sticky bottom with safe-area padding */}
    <div className="sticky bottom-0 p-4 border-t bg-background
                    pb-[max(1rem,env(safe-area-inset-bottom))]">
      <PromptInput onSubmit={handleGenerate} disabled={isGenerating} />
    </div>
  </main>

  {/* Mobile: History Sheet */}
  <Sheet open={showHistory} onOpenChange={setShowHistory}>
    <SheetContent side="bottom" className="h-[80vh]">
      <SheetTitle>Document History</SheetTitle>
      <MetaDocHistory profileId={profileId} activeDocId={activeDocId} onSelect={(id) => { setActiveDocId(id); setShowHistory(false) }} />
    </SheetContent>
  </Sheet>
</div>
```
