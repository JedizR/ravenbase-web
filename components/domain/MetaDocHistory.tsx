"use client"
import { useQuery } from "@tanstack/react-query"
import { FileText, History, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { listMetaDocumentsV1MetadocGet } from "@/src/lib/api-client/services.gen"
import type { MetaDocSummary } from "@/src/lib/api-client/types.gen"

interface MetaDocHistoryProps {
  activeDocId?: string | null
  onSelectDoc?: (doc: MetaDocSummary) => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return date.toLocaleDateString()
}

export function MetaDocHistory({
  activeDocId,
  onSelectDoc,
  mobileOpen,
  onMobileOpenChange,
}: MetaDocHistoryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["meta-documents"],
    queryFn: async () => {
      const res = await listMetaDocumentsV1MetadocGet({ page: 1, pageSize: 50 })
      return res.items as unknown as MetaDocSummary[]
    },
    staleTime: 30_000,
  })

  const docs = data ?? []

  const historyContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-mono text-muted-foreground tracking-wider">
          ◆ DOCUMENT_HISTORY
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No Meta-Documents yet.</p>
            <p className="text-xs mt-1">Generate your first above.</p>
          </div>
        ) : (
          <ul className="p-2">
            {docs.map((doc) => (
              <li key={doc.id}>
                <button
                  onClick={() => onSelectDoc?.(doc)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    doc.id === activeDocId
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatRelativeTime(doc.generated_at)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: visible sidebar */}
      <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-border h-full">
        {historyContent}
      </div>

      {/* Mobile: Sheet trigger */}
      <div className="flex md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMobileOpenChange?.(true)}
          className="gap-1.5"
        >
          <History className="w-4 h-4" />
          History
          {docs.length > 0 && (
            <span className="ml-1 text-xs font-mono text-muted-foreground">
              ({docs.length})
            </span>
          )}
        </Button>

        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="px-4 py-3 border-b border-border">
              <SheetTitle className="text-xs font-mono tracking-wider">
                ◆ DOCUMENT_HISTORY
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">{historyContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
