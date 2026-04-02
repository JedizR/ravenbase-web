"use client"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "text/markdown": [".md", ".markdown"],
  "application/zip": [".zip"],
  "application/json": [".json"],
}

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

interface IngestionDropzoneProps {
  onFileAccepted: (file: File) => void
  onFileRejected?: () => void
  selectedFile?: File | null
}

export function IngestionDropzone({
  onFileAccepted,
  onFileRejected,
  selectedFile,
}: IngestionDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[], rejected: { file: File }[]) => {
      if (accepted.length > 0) {
        onFileAccepted(accepted[0])
      } else if (rejected.length > 0) {
        onFileRejected?.()
      }
    },
    [onFileAccepted, onFileRejected],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: false,
    maxFiles: 1,
    maxSize: MAX_SIZE,
  })

  return (
    <div
      {...getRootProps()}
      className={[
        "rounded-2xl border-2 border-dashed p-8 text-center transition-colors duration-150 cursor-pointer",
        isDragActive
          ? "border-primary bg-primary/5"
          : selectedFile
            ? "border-primary/50 bg-secondary"
            : "border-border hover:border-primary/50 hover:bg-secondary/50",
      ].join(" ")}
    >
      <input {...getInputProps()} />
      {selectedFile ? (
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground tracking-wider">
            ◆ FILE_SELECTED
          </p>
          <p className="text-sm font-medium text-foreground truncate">
            {selectedFile.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(0)} KB — click or drop to replace
          </p>
        </div>
      ) : isDragActive ? (
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground tracking-wider">
            ◆ DROP_TO_UPLOAD
          </p>
          <p className="text-sm text-foreground">Release to add files</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground tracking-wider">
            ◆ DROP_FILES_HERE
          </p>
          <p className="text-sm text-foreground">
            PDF, TXT, Markdown, ChatGPT export, ZIP
          </p>
          <p className="text-xs text-muted-foreground">Up to 50 MB</p>
        </div>
      )}
    </div>
  )
}
