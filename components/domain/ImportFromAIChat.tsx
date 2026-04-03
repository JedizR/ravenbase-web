"use client"
import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { GeneratedPromptBox } from "./GeneratedPromptBox"
import { IngestionProgress } from "./IngestionProgress"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronUp, AlertTriangle, Loader2 } from "lucide-react"
import { useProfile } from "@/contexts/ProfileContext"
import {
  getImportPromptV1IngestImportPromptGet,
  ingestTextV1IngestTextPost,
} from "@/src/lib/api-client/services.gen"

// Fallback generic prompt when the endpoint fails
const GENERIC_PROMPT = `Please analyze this conversation and extract a structured knowledge summary.

Summarize all key topics, decisions, and learnings from this conversation.

For each topic found, provide:
- **Topic:** [name]
- **Key facts:** [bullet points of specific facts, decisions, or learnings]
- **Tools/technologies:** [if applicable]
- **Timeline:** [approximate dates or sequence if mentioned]
- **Status:** [current/past/planned]

Be specific and factual. Include concrete details like project names, technology versions,
outcomes, and decisions made. Omit pleasantries and filler. Output only the structured summary.`

const INSTRUCTIONS = [
  "Copy the prompt above.",
  "Open ChatGPT, Claude, Gemini, or any AI assistant.",
  "Paste the prompt and send it.",
  "Copy the AI's full response.",
  "Paste it below and click Import.",
]

type ImportState = "idle" | "pending" | "streaming" | "complete"

export function ImportFromAIChat() {
  const { profiles, activeProfile, setActiveProfile } = useProfile()
  const [pastedText, setPastedText] = useState("")
  const [state, setState] = useState<ImportState>("idle")
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [instructionsOpen, setInstructionsOpen] = useState(false)

  const { data: promptData, isLoading: isLoadingPrompt } = useQuery({
    queryKey: ["import-prompt", activeProfile?.id],
    queryFn: () =>
      getImportPromptV1IngestImportPromptGet({
        profileId: activeProfile?.id ?? undefined,
      }),
    enabled: true,
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: (content: string) =>
      ingestTextV1IngestTextPost({
        requestBody: {
          content,
          profile_id: activeProfile?.id ?? undefined,
        },
      }),
    onSuccess: (res) => {
      setSourceId(res.source_id)
      setState("streaming")
      toast.success("Import started", {
        description: "Processing your AI chat context...",
      })
    },
    onError: (err: unknown) => {
      const error = err as { status?: number; message?: string }
      if (error.status === 402) {
        toast.error("Insufficient credits. Top up in Settings → Billing.")
      } else {
        toast.error(error.message ?? "Import failed. Try again.")
      }
      setState("idle")
    },
  })

  const handleReset = () => {
    setPastedText("")
    setSourceId(null)
    setState("idle")
  }

  const handleSubmit = () => {
    if (!pastedText.trim()) {
      toast.error("Paste an AI response first")
      return
    }
    setState("pending")
    mutation.mutate(pastedText)
  }

  const promptText = promptData?.prompt_text ?? GENERIC_PROMPT
  const promptError = !isLoadingPrompt && !promptData

  const isDisabled = state === "pending" || state === "streaming"

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile selector */}
      <div className="space-y-2">
        <label
          htmlFor="profile-select"
          className="text-sm font-medium text-foreground"
        >
          Import into profile
        </label>
        <Select
          value={activeProfile?.id ?? ""}
          onValueChange={(id) => {
            const p = profiles.find((x) => x.id === id)
            if (p) setActiveProfile(p)
          }}
          disabled={isDisabled}
        >
          <SelectTrigger id="profile-select" className="w-full max-w-xs">
            <SelectValue placeholder="Select profile" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Generated prompt */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground tracking-wider">
            ◆ AI_EXTRACTION_PROMPT
          </span>
          {promptData?.detected_concepts &&
            promptData.detected_concepts.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {promptData.detected_concepts.length} concepts found
              </Badge>
            )}
        </div>

        {/* Error fallback banner */}
        {promptError && (
          <div
            role="alert"
            className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/25 rounded-xl text-sm"
          >
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p>Could not load personalized prompt. Using generic version.</p>
          </div>
        )}

        {isLoadingPrompt ? (
          <div className="h-32 md:min-h-[200px] bg-secondary/50 rounded-xl animate-pulse" />
        ) : (
          <GeneratedPromptBox promptText={promptText} />
        )}
      </div>

      {/* Instructions panel — desktop: always visible; mobile: collapsible toggle */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden flex items-center justify-between w-full text-left"
          onClick={() => setInstructionsOpen((o) => !o)}
          aria-expanded={instructionsOpen}
        >
          <span className="text-xs font-mono text-muted-foreground tracking-wider">
            ◆ HOW_TO_IMPORT
          </span>
          {instructionsOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        {/* Desktop always-visible label */}
        <span className="hidden md:block text-xs font-mono text-muted-foreground tracking-wider">
          ◆ HOW_TO_IMPORT
        </span>

        {/* Instructions list — visible on desktop, toggled on mobile */}
        <ol
          className={`space-y-2 ${instructionsOpen ? "block" : "hidden"} md:block`}
        >
          {INSTRUCTIONS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-mono shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Paste area — hidden while streaming */}
      {state !== "streaming" && (
        <div className="space-y-2">
          <label
            htmlFor="ai-response"
            className="text-sm font-medium text-foreground"
          >
            AI response
          </label>
          <Textarea
            id="ai-response"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste the AI's full structured response here..."
            maxLength={100000}
            className="min-h-[200px] resize-none"
            disabled={isDisabled}
            aria-label="Paste AI response here"
          />
          <p className="text-xs text-muted-foreground text-right">
            {pastedText.length.toLocaleString()} / 100,000
          </p>
        </div>
      )}

      {/* Action area — state-driven */}
      {state === "streaming" && sourceId ? (
        <div className="space-y-3">
          <IngestionProgress sourceId={sourceId} />
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full rounded-full"
          >
            Import another
          </Button>
        </div>
      ) : state === "complete" ? (
        <div className="space-y-3">
          <div className="p-4 bg-success/10 border border-success/25 rounded-xl text-sm">
            Successfully imported. Your knowledge graph has been updated.
          </div>
          <Button onClick={handleReset} className="w-full rounded-full">
            Import another
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!pastedText.trim() || mutation.isPending}
          className="w-full rounded-full"
          size="lg"
          aria-live="polite"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : "Import"}
        </Button>
      )}
    </div>
  )
}
