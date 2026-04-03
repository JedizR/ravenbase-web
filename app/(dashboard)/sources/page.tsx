"use client"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImportFromAIChat } from "@/components/domain/ImportFromAIChat"
import { IngestionDropzone } from "@/components/domain/IngestionDropzone"
import { IngestionProgress } from "@/components/domain/IngestionProgress"
import { FileText, Upload } from "lucide-react"
import { useApiUpload } from "@/lib/api-client"
import { useProfile } from "@/contexts/ProfileContext"
import { toast } from "sonner"

export default function SourcesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const apiUpload = useApiUpload()
  const { activeProfile } = useProfile()

  const handleFileAccepted = async (file: File) => {
    setSelectedFile(file)
    setUploading(true)
    setSourceId(null)

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
      setSourceId(data.source_id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      toast.error(`Upload failed: ${msg}`)
      setSelectedFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleFileRejected = () => {
    toast.error("File type not supported. Please upload a PDF, DOCX, or text file.")
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="font-mono text-xs text-muted-foreground tracking-wider mb-1">◆ KNOWLEDGE_SOURCES</p>
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
    </div>
  )
}
