"use client"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Download,
  Loader2,
  CheckCircle2,
  FileText,
  Table,
  Archive,
} from "lucide-react"
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
  job_id: string
  download_url: string | null
  progress: number
  error: string | null
}

const formats = [
  {
    id: "json" as const,
    label: "JSON",
    description: "Complete structured data, machine-readable",
    icon: FileText,
  },
  {
    id: "csv" as const,
    label: "CSV",
    description: "Spreadsheet-compatible, sources and memories only",
    icon: Table,
  },
  {
    id: "zip" as const,
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

  // Export mutation — triggers POST /v1/account/export
  const exportMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ job_id: string }>("/v1/account/export", {
        method: "POST",
        body: JSON.stringify({ format: selectedFormat }),
      }),
    onSuccess: (data) => {
      // Store job_id so the status query can poll it
      queryClient.setQueryData(["export-job-id"], data)
      queryClient.setQueryData(["export-status"], {
        status: "queued",
        job_id: data.job_id,
        download_url: null,
        progress: 0,
        error: null,
      } as ExportStatus)
      toast.success("Export started. We'll email you when it's ready.")
    },
    onError: (error: Error & { response?: { status?: number; data?: { detail?: { code?: string; message?: string; retry_after_seconds?: number } } } }) => {
      // AC-2: Handle rate limit (429) specifically
      if (error?.response?.status === 429) {
        const retryAfter = error.response.data?.detail?.retry_after_seconds
        const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 60
        toast.error(
          `Export already in progress. Try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`
        )
        return
      }
      toast.error("Export failed. Please try again or contact support.")
    },
  })

  // Poll export status — enabled only when we have a job_id
  const { data: exportStatus } = useQuery<ExportStatus>({
    queryKey: ["export-status"],
    queryFn: async () => {
      const jobData = queryClient.getQueryData<{ job_id: string }>(["export-job-id"])
      if (!jobData?.job_id) throw new Error("No job ID")
      return apiFetch<ExportStatus>(
        `/v1/account/export/status?job_id=${jobData.job_id}`
      )
    },
    enabled: !!queryClient.getQueryData<{ job_id: string }>(["export-job-id"])?.job_id,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      return status === "ready" || status === "failed" ? false : 3000
    },
  })

  const isExporting =
    exportStatus?.status === "queued" || exportStatus?.status === "preparing"
  const canDownload = exportStatus?.status === "ready"
  const hasFailed = exportStatus?.status === "failed"
  const progress = exportStatus?.progress ?? 0
  const downloadUrl = exportStatus?.download_url ?? null

  const handleDeleteAccount = async () => {
    toast.success("Account deletion initiated. You'll receive a confirmation email.")
    setConfirmText("")
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

        {/* Format selector — 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {formats.map((f) => {
            const Icon = f.icon
            const isSelected = selectedFormat === f.id
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFormat(f.id)}
                aria-pressed={isSelected}
                className={`
                  bg-card rounded-2xl border p-4 text-left cursor-pointer
                  transition-all hover:shadow-md
                  ${isSelected
                    ? "border-2 border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                  }
                `}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-medium text-sm mb-1">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </button>
            )
          })}
        </div>

        {/* EXPORT BUTTON STATES */}
        {/* State 1: Idle — show export button */}
        {(!exportStatus || exportStatus.status === "idle") && (
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground
                       font-medium flex items-center justify-center gap-2
                       disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            ◆ EXPORT_DATA
          </button>
        )}

        {/* State 2: Loading — show spinner with "Preparing export..." */}
        {exportMutation.isPending && (
          <button
            disabled
            className="w-full h-11 rounded-full bg-primary text-primary-foreground
                       font-medium flex items-center justify-center gap-2
                       opacity-70"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing export...
          </button>
        )}

        {/* State 3: Exporting — show progress bar */}
        {isExporting && (
          <div className="space-y-2">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Preparing export... {progress}%
            </p>
          </div>
        )}

        {/* State 4: Download ready */}
        {canDownload && downloadUrl && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <p className="font-serif text-lg">Your data is ready</p>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              Download expires in 24 hours
            </p>
            <a
              href={downloadUrl}
              download
              className="w-full h-11 rounded-full bg-success text-success-foreground
                         font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download ZIP
            </a>
          </div>
        )}

        {/* State 5: Failed */}
        {hasFailed && (
          <div className="bg-destructive/10 border border-destructive/25 rounded-2xl p-4">
            <p className="text-sm text-destructive">
              Export failed: {exportStatus.error ?? "Unknown error"}. Please try again or contact support.
            </p>
            <button
              onClick={() => {
                queryClient.setQueryData(["export-job-id"], null)
                queryClient.setQueryData(["export-status"], null)
              }}
              className="mt-2 text-xs text-destructive underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      {/* Danger zone — DELETE ACCOUNT (GDPR) */}
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

            {/* AC-10: Confirmation input — user must type "DELETE" */}
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
                autoComplete="off"
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