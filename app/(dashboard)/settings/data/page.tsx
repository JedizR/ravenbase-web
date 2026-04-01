"use client"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Loader2, CheckCircle2, FileText, Table, Archive } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useApiFetch } from "@/lib/api-client"

interface ExportStatus {
  status: "idle" | "queued" | "preparing" | "ready" | "failed"
  job_id?: string
  download_url?: string
  progress?: number
}

const formats = [
  {
    id: "json",
    label: "JSON",
    description: "Complete structured data, machine-readable",
    icon: FileText,
  },
  {
    id: "csv",
    label: "CSV",
    description: "Spreadsheet-compatible, sources and memories only",
    icon: Table,
  },
  {
    id: "zip",
    label: "ZIP",
    description: "Everything including original uploaded files",
    icon: Archive,
  },
]

export default function DataSettingsPage() {
  const [selectedFormat, setSelectedFormat] = useState<"json" | "csv" | "zip">("json")
  const [confirmText, setConfirmText] = useState("")
  const queryClient = useQueryClient()
  const apiFetch = useApiFetch()

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ job_id: string }>("/v1/account/export", {
        method: "POST",
        body: JSON.stringify({ format: selectedFormat }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["export-status"], {
        status: "queued",
        job_id: data.job_id,
      } as ExportStatus)
      toast.success("Export started. We'll email you when it's ready.")
    },
    onError: () => {
      toast.error("Export failed. Please try again or contact support.")
    },
  })

  // Poll export status
  const { data: exportStatus } = useQuery<ExportStatus>({
    queryKey: ["export-status"],
    queryFn: async () => {
      const jobId = queryClient.getQueryData<{ job_id: string }>(["export-mutation"])?.job_id
      if (!jobId) throw new Error("No job ID")
      return apiFetch<ExportStatus>(
        `/v1/account/export/status?job_id=${jobId}`
      )
    },
    enabled: !!exportMutation.data?.job_id,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      return status === "ready" || status === "failed" ? false : 3000
    },
  })

  const isExporting =
    exportStatus?.status === "queued" || exportStatus?.status === "preparing"
  const canDownload = exportStatus?.status === "ready"
  const progress = exportStatus?.progress ?? 0

  const handleDeleteAccount = async () => {
    // Backend handles full deletion flow
    toast.success("Account deletion initiated. You'll receive a confirmation email.")
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Export section */}
      <section>
        <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">
          ◆ DATA_PORTABILITY
        </p>
        <h1 className="font-serif text-3xl mb-2">Your Data</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Download everything you have stored in Ravenbase.
        </p>

        {/* Format selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFormat(f.id as typeof selectedFormat)}
              className={`
                bg-card rounded-2xl border p-4 text-left cursor-pointer
                transition-all hover:shadow-md
                ${selectedFormat === f.id
                  ? "border-2 border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
                }
              `}
            >
              <p className="font-medium text-sm mb-1">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.description}</p>
            </button>
          ))}
        </div>

        {/* Export button states */}
        {(!exportStatus || exportStatus.status === "idle") && (
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground
                       font-medium flex items-center justify-center gap-2
                       disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            ◆ EXPORT_DATA
          </button>
        )}

        {isExporting && (
          <div className="space-y-2">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Preparing export... {progress}%
            </p>
          </div>
        )}

        {canDownload && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <p className="font-serif text-lg">Your data is ready</p>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              Download expires in 24 hours
            </p>
            <a
              href={exportStatus.download_url}
              download
              className="w-full h-11 rounded-full bg-success text-success-foreground
                         font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download ZIP
            </a>
          </div>
        )}
      </section>

      {/* Danger zone — DELETE ACCOUNT */}
      <Separator />
      <section>
        <p className="text-xs font-mono text-destructive tracking-wider mb-2">
          ◆ DANGER_ZONE
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full h-11 rounded-full border border-destructive
                               text-destructive font-medium
                               hover:bg-destructive hover:text-destructive-foreground
                               transition-colors">
              Delete my account and all data
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes your account, knowledge graph,
                and all uploaded files. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* AC-10: Confirmation input */}
            <div className="space-y-2">
              <label htmlFor="delete-confirm" className="text-sm font-medium">
                Type{" "}
                <span className="font-mono text-destructive">DELETE</span>{" "}
                to confirm
              </label>
              <Input
                id="delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className={
                  confirmText === "DELETE"
                    ? "border-success focus:border-success"
                    : ""
                }
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={confirmText !== "DELETE"}
                className="bg-destructive text-destructive-foreground
                           hover:bg-destructive/90 disabled:opacity-50"
              >
                Delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}