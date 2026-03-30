"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RavenbaseLockup } from "@/components/brand"
import { IngestionDropzone } from "@/components/domain/IngestionDropzone"
import { useApiFetch, useApiUpload } from "@/lib/api-client"
import { useSSE } from "@/hooks/use-sse"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "Software Engineer" | "Student" | "Designer" | "Researcher" | "Other"
type Step = 1 | 2 | 3

const ROLES: Role[] = [
  "Software Engineer",
  "Student",
  "Designer",
  "Researcher",
  "Other",
]

const ROLE_DEFAULTS: Record<Role, string> = {
  "Software Engineer": "Work — Software Engineer",
  Student: "University Notes",
  Designer: "Design Research",
  Researcher: "Research — Primary",
  Other: "My Knowledge Base",
}

interface UserMeResponse {
  has_completed_onboarding: boolean
}

interface UploadResponse {
  source_id: string
  status: string
}

interface TextIngestResponse {
  source_id: string
  status: string
}

// ---------------------------------------------------------------------------
// OnboardingWizard
// ---------------------------------------------------------------------------

export function OnboardingWizard() {
  const router = useRouter()
  const apiFetch = useApiFetch()
  const apiUpload = useApiUpload()
  const { getToken } = useAuth()

  const [step, setStep] = useState<Step>(1)
  const [role, setRole] = useState<Role | null>(null)
  const [profileName, setProfileName] = useState("")
  const [profileNameError, setProfileNameError] = useState<string | null>(null)
  const [profileNameTouched, setProfileNameTouched] = useState(false)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState("")
  const [fileRejected, setFileRejected] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [sourceId, setSourceId] = useState<string | null>(null)
  const [sseToken, setSseToken] = useState<string | null>(null)
  const [hasCompleted, setHasCompleted] = useState(false)

  // -------------------------------------------------------------------------
  // AC-7: Check if user already completed onboarding — redirect if so
  // -------------------------------------------------------------------------
  const { data: userData } = useQuery({
    queryKey: ["users", "me", "onboarding-check"],
    queryFn: () => apiFetch<UserMeResponse>("/v1/users/me"),
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    if (userData?.has_completed_onboarding) {
      router.replace("/dashboard")
    }
  }, [userData, router])

  // -------------------------------------------------------------------------
  // Step 3: SSE connection
  // -------------------------------------------------------------------------
  const sseUrl = sourceId ? `/v1/ingest/stream/${sourceId}` : null
  const sseState = useSSE(sseUrl, sseToken)

  // Fetch token when entering step 3 (EventSource needs it as query param)
  useEffect(() => {
    if (step === 3 && sourceId) {
      getToken().then((t) => setSseToken(t)).catch(() => null)
    }
  }, [step, sourceId, getToken])

  // Auto-advance to dashboard when processing completes
  useEffect(() => {
    if (sseState.status === "complete" && !hasCompleted) {
      setHasCompleted(true)
      completeOnboarding()
    }
  }, [sseState.status, hasCompleted]) // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  async function completeOnboarding() {
    try {
      await apiFetch("/v1/users/me/complete-onboarding", { method: "POST" })
    } catch {
      // Best-effort — don't block navigation if backend isn't ready
    }
    router.push("/dashboard?first_run=true")
  }

  function validateProfileName(value: string): string | null {
    if (!value.trim()) return "Profile name is required"
    if (value.trim().length < 2) return "Must be at least 2 characters"
    return null
  }

  function handleProfileNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    setProfileNameTouched(true)
    clearTimeout(blurTimerRef.current)
    blurTimerRef.current = setTimeout(() => {
      setProfileNameError(validateProfileName(e.target.value))
    }, 300)
  }

  function handleRoleSelect(r: Role) {
    setRole(r)
    if (!profileNameTouched) {
      setProfileName(ROLE_DEFAULTS[r])
    }
  }

  async function handleUpload() {
    if (!file && !pastedText.trim()) return
    setIsSubmitting(true)
    setUploadError(null)
    try {
      let sid: string
      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        const res = await apiUpload<UploadResponse>("/v1/ingest/upload", formData)
        sid = res.source_id
      } else {
        const res = await apiFetch<TextIngestResponse>("/v1/ingest/text", {
          method: "POST",
          body: JSON.stringify({ content: pastedText }),
        })
        sid = res.source_id
      }
      setSourceId(sid)
      setStep(3)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSkip() {
    await completeOnboarding()
  }

  // -------------------------------------------------------------------------
  // Step indicator value
  // -------------------------------------------------------------------------
  const progressPercent = (step / 3) * 100

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
      {/* Skip link — WCAG 2.1 AA RULE 16 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Logo */}
      <div className="mb-8 text-primary">
        <RavenbaseLockup size="lg" />
      </div>

      {/* Wizard card */}
      <main
        id="main-content"
        className="w-full max-w-md bg-card rounded-2xl sm:border sm:border-border p-6 animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        {/* Step indicator */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground tracking-wider">
              ◆ STEP_{step}_OF_3
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {step}/3
            </span>
          </div>
          <Progress value={progressPercent} className="h-1" />
        </div>

        {step === 1 && (
          <StepProfile
            role={role}
            profileName={profileName}
            profileNameError={profileNameError}
            profileNameTouched={profileNameTouched}
            onRoleSelect={handleRoleSelect}
            onProfileNameChange={setProfileName}
            onProfileNameBlur={handleProfileNameBlur}
            onContinue={() => {
              const err = validateProfileName(profileName)
              setProfileNameError(err)
              setProfileNameTouched(true)
              if (!role || err) return
              setStep(2)
            }}
          />
        )}

        {step === 2 && (
          <StepUpload
            file={file}
            pastedText={pastedText}
            fileRejected={fileRejected}
            isSubmitting={isSubmitting}
            uploadError={uploadError}
            onFileAccepted={(f) => {
              setFile(f)
              setFileRejected(false)
            }}
            onFileRejected={() => setFileRejected(true)}
            onPastedTextChange={setPastedText}
            onUpload={handleUpload}
            onSkip={handleSkip}
          />
        )}

        {step === 3 && (
          <StepProgress
            sseState={sseState}
            onForceContinue={completeOnboarding}
          />
        )}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StepProfile
// ---------------------------------------------------------------------------

interface StepProfileProps {
  role: Role | null
  profileName: string
  profileNameError: string | null
  profileNameTouched: boolean
  onRoleSelect: (r: Role) => void
  onProfileNameChange: (v: string) => void
  onProfileNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  onContinue: () => void
}

function StepProfile({
  role,
  profileName,
  profileNameError,
  profileNameTouched,
  onRoleSelect,
  onProfileNameChange,
  onProfileNameBlur,
  onContinue,
}: StepProfileProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-1">
          Create your first profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Profiles let you keep different areas of your life separate.
        </p>
      </div>

      {/* Role selector */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          What best describes you?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRoleSelect(r)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onRoleSelect(r)
                }
              }}
              aria-pressed={role === r}
              className={[
                "rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-150 h-11 sm:h-auto",
                role === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary",
              ].join(" ")}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Profile name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="profile-name"
          className="text-sm font-medium text-foreground"
        >
          Profile name
        </label>
        <input
          id="profile-name"
          type="text"
          value={profileName}
          onChange={(e) => onProfileNameChange(e.target.value)}
          onBlur={onProfileNameBlur}
          placeholder="e.g. Work — Software Engineer"
          aria-invalid={profileNameTouched && !!profileNameError}
          aria-describedby={profileNameError ? "profile-name-error" : undefined}
          className={[
            "w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-colors",
            profileNameTouched && profileNameError
              ? "border-destructive"
              : "border-border",
          ].join(" ")}
        />
        {profileNameTouched && profileNameError && (
          <p
            id="profile-name-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {profileNameError}
          </p>
        )}
      </div>

      <Button
        type="button"
        onClick={onContinue}
        disabled={!role}
        className="w-full rounded-full h-11"
      >
        Continue →
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StepUpload
// ---------------------------------------------------------------------------

interface StepUploadProps {
  file: File | null
  pastedText: string
  fileRejected: boolean
  isSubmitting: boolean
  uploadError: string | null
  onFileAccepted: (f: File) => void
  onFileRejected: () => void
  onPastedTextChange: (v: string) => void
  onUpload: () => void
  onSkip: () => void
}

function StepUpload({
  file,
  pastedText,
  fileRejected,
  isSubmitting,
  uploadError,
  onFileAccepted,
  onFileRejected,
  onPastedTextChange,
  onUpload,
  onSkip,
}: StepUploadProps) {
  const hasContent = !!file || pastedText.trim().length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-1">
          Upload your first file
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a document, note, or conversation to start building your knowledge
          graph.
        </p>
      </div>

      <IngestionDropzone
        onFileAccepted={onFileAccepted}
        onFileRejected={onFileRejected}
        selectedFile={file}
      />

      {fileRejected && (
        <p className="text-xs text-destructive" role="alert">
          File type not supported or exceeds 50 MB limit.
        </p>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-mono">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Paste area */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="paste-text"
          className="text-sm font-medium text-foreground"
        >
          Paste text from a note or conversation
        </label>
        <textarea
          id="paste-text"
          value={pastedText}
          onChange={(e) => onPastedTextChange(e.target.value)}
          placeholder="Paste any text here — meeting notes, a journal entry, a chat export..."
          rows={4}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none transition-colors"
        />
      </div>

      {uploadError && (
        <p className="text-xs text-destructive" role="alert">
          {uploadError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={onUpload}
          disabled={!hasContent || isSubmitting}
          className="flex-1 rounded-full h-11"
        >
          {isSubmitting ? "Uploading..." : "Upload →"}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors h-11 px-3"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StepProgress
// ---------------------------------------------------------------------------

interface StepProgressProps {
  sseState: ReturnType<typeof useSSE>
  onForceContinue: () => void
}

function StepProgress({ sseState, onForceContinue }: StepProgressProps) {
  const { progress, message, entities, status } = sseState

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-1">
          Building your graph
        </h1>
        <p className="text-sm text-muted-foreground">
          Ravenbase is extracting entities and relationships from your document.
        </p>
      </div>

      {/* Progress bar — RULE 17: aria-live for streamed content */}
      <div
        aria-live="polite"
        aria-atomic="false"
        aria-label="Processing progress"
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground tracking-wider">
            ◆ PROCESSING_DOCUMENT
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {progress}%
          </span>
        </div>

        <Progress value={progress} className="h-2" />

        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}

        {/* Entities found */}
        {entities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted-foreground tracking-wider">
              ◆ FOUND_SO_FAR
            </p>
            <div className="flex flex-wrap gap-2">
              {entities.map((entity) => (
                <span
                  key={entity}
                  className="bg-secondary rounded-full px-3 py-1 text-xs font-mono text-foreground"
                >
                  {entity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {status === "complete" && "Processing complete. Redirecting to dashboard."}
        {status === "error" && "Processing encountered an error."}
        {status === "processing" && `Processing: ${progress}%`}
      </div>

      {status === "error" && (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            Processing encountered an error. Your file was saved — you can retry
            from the dashboard.
          </p>
          <Button
            type="button"
            onClick={onForceContinue}
            className="w-full rounded-full h-11"
          >
            Go to dashboard →
          </Button>
        </div>
      )}

      {(status === "idle" || status === "connecting") && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Connecting...
        </p>
      )}
    </div>
  )
}
