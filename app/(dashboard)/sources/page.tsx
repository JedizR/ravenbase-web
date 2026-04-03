"use client"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImportFromAIChat } from "@/components/domain/ImportFromAIChat"
import { IngestionDropzone } from "@/components/domain/IngestionDropzone"
import { IngestionProgress } from "@/components/domain/IngestionProgress"
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  File,
} from "lucide-react"
import { useApiUpload, useApiFetch } from "@/lib/api-client"
import { useProfile } from "@/contexts/ProfileContext"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface SourceItem {
  id: string
  original_filename: string
  file_type: string
  mime_type: string
  file_size_bytes: number
  status: string
  chunk_count: number | null
  error_message: string | null
  ingested_at: string
  completed_at: string | null
}

function statusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
    case "failed":
      return <AlertCircle className="w-4 h-4 text-destructive" />
    case "processing":
    case "indexing":
      return <Loader2 className="w-4 h-4 text-info animate-spin" />
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function SourcesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const apiUpload = useApiUpload()
  const apiFetch = useApiFetch()
  const { activeProfile } = useProfile()
  const queryClient = useQueryClient()

  // Fetch upload history
  const { data: sourcesData, isLoading: sourcesLoading } = useQuery<{
    items: SourceItem[]
    total: number
  }>({
    queryKey: ["sources"],
    queryFn: () =>
      apiFetch<{ items: SourceItem[]; total: number }>("/v1/ingest/sources"),
    staleTime: 15_000,
    refetchInterval: uploading || sourceId ? 5000 : false,
  })

  const handleFileAccepted = async (file: File) => {
    setSelectedFile(file)
    setUploading(true)
    setSourceId(null)
    const loadingId = toast.loading(`Uploading ${file.name}...`)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (activeProfile?.id) {
        formData.append("profile_id", activeProfile.id)
      }
      const data = await apiUpload<{ source_id: string; status: string }>(
        "/v1/ingest/upload",
        formData,
      )
      toast.dismiss(loadingId)
      setSourceId(data.source_id)
      // Refresh the sources list
      queryClient.invalidateQueries({ queryKey: ["sources"] })
    } catch (err) {
      toast.dismiss(loadingId)
      const msg = err instanceof Error ? err.message : "Unknown error"
      toast.error(`Upload failed: ${msg}`)
      setSelectedFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleFileRejected = () => {
    toast.error(
      "File type not supported. Please upload a PDF, DOCX, or text file."
    )
  }

  const handleReset = () => {
    setSelectedFile(null)
    setSourceId(null)
    queryClient.invalidateQueries({ queryKey: ["sources"] })
  }

  const sources = sourcesData?.items ?? []

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="font-mono text-xs text-muted-foreground tracking-wider mb-1">
          ◆ KNOWLEDGE_SOURCES
        </p>
        <h1 className="font-serif text-3xl">Sources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload files or import context from AI chats.
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <FileText className="w-4 h-4" />
            Import from AI Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6 space-y-4">
          <IngestionDropzone
            onFileAccepted={handleFileAccepted}
            onFileRejected={handleFileRejected}
            onClear={() => {
              setSelectedFile(null)
              setSourceId(null)
            }}
            selectedFile={selectedFile}
          />
          {(uploading || sourceId) && (
            <IngestionProgress sourceId={sourceId} />
          )}
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <ImportFromAIChat />
        </TabsContent>
      </Tabs>

      {/* Upload History */}
      <section>
        <p className="font-mono text-xs text-muted-foreground tracking-wider mb-3">
          ◆ UPLOAD_HISTORY
        </p>
        {sourcesLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-4 animate-pulse"
              >
                <div className="h-4 bg-secondary rounded w-1/3" />
                <div className="h-3 bg-secondary rounded w-1/5 mt-2" />
              </div>
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <File className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No sources uploaded yet. Upload a file or import from an AI chat
              to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div className="shrink-0">{statusIcon(source.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {source.original_filename}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{formatBytes(source.file_size_bytes)}</span>
                    <span>·</span>
                    <span className="uppercase">{source.file_type}</span>
                    {source.chunk_count != null && (
                      <>
                        <span>·</span>
                        <span>{source.chunk_count} chunks</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{timeAgo(source.ingested_at)}</span>
                  </div>
                  {source.error_message && (
                    <p className="text-xs text-destructive mt-1 truncate">
                      {source.error_message}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    source.status === "completed"
                      ? "bg-[var(--success)]/10 text-[var(--success)]"
                      : source.status === "failed"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {source.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
