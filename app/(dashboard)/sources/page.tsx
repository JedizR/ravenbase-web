"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImportFromAIChat } from "@/components/domain/ImportFromAIChat"
import { FileText, Upload } from "lucide-react"

export default function SourcesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
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

        <TabsContent value="upload" className="mt-6">
          <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-2xl">
            <p className="text-sm text-muted-foreground">
              File upload coming soon.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <ImportFromAIChat />
        </TabsContent>
      </Tabs>
    </div>
  )
}
