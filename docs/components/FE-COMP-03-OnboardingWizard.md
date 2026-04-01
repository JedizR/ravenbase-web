# OnboardingWizard

> **Component ID:** FE-COMP-03
> **Epic:** EPIC-06 — Authentication & System Profiles
> **Stories:** STORY-019
> **Type:** Frontend (Dashboard)

---

## Goal

The Onboarding Wizard is the first experience for new Ravenbase users after completing Clerk registration. It guides users through creating their first System Profile and optionally uploading their first file. It creates a welcoming, low-friction path into the product. After onboarding, users are redirected to the dashboard.

---

## Product Requirements

1. **Redirect Logic:** New users (no System Profiles) are redirected to `/onboarding` after first login. Onboarding completion redirects to `/dashboard`.

2. **Profile Name Input:** First step: enter a profile name (e.g., "Work", "Personal", "Research"). Required, minimum 2 characters. Validated on blur with 300ms debounce.

3. **Optional File Upload:** Second step: optionally upload a first file to get immediate value. Accepts PDF and DOCX. Uses `react-dropzone` for drag-and-drop. Can be skipped.

4. **Progress Indicator:** Shows step 1 of 2 or step 2 of 2. Steps: Create Profile → Upload First File.

5. **Ingestion Flow:** If file uploaded, it follows the standard ingestion pipeline (COMP-01). Shows SSE progress. Profile is linked to the uploaded source.

6. **Completion:** After profile created (and optional upload started), redirect to `/dashboard`.

7. **Skip Option:** "Skip for now" link to go directly to dashboard without uploading a file.

8. **Welcome Message:** Warm, encouraging copy: "Welcome to Ravenbase. Let's set up your first memory profile."

---

## Criteria and Tests

| Criterion | Test |
|---|---|
| New user redirected to /onboarding | Create account → land on /onboarding |
| Profile name required, min 2 chars | Submit blank → validation error shown |
| Profile created in PostgreSQL | Complete onboarding → SELECT * FROM system_profiles |
| Optional file triggers ingestion | Upload PDF → see SSE progress → source appears in dashboard |
| Skip goes to /dashboard | Click skip → /dashboard with no sources |
| Progress indicator shows correct step | Step 1: "Create Profile" highlighted; Step 2: "Upload File" |
| Profile linked to uploaded source | Upload file + create profile "Work" → source.profile_id = work.id |
| Redirects to /dashboard after completion | Finish onboarding → /dashboard |
| Loading states shown during API calls | Submit → button shows spinner until response |
| Error toast on API failure | Mock failure → toast.error shown |
| Mobile responsive | Resize to 375px → steps stack, upload area full-width |

---

## Related Stories

| Story | Title | Type | Description |
|---|---|---|---|
| [STORY-019](../stories/EPIC-06-auth-profiles/STORY-019.md) | Onboarding Wizard | Frontend | Profile creation + first upload flow |

---

## Component Files

```
app/(dashboard)/onboarding/
  page.tsx            — Orchestrates wizard steps
  loading.tsx         — Skeleton loading state

components/domain/
  OnboardingWizard.tsx     — Multi-step wizard container
  ProfileNameStep.tsx      — Step 1: profile name input
  FileUploadStep.tsx       — Step 2: optional file upload
  IngestionProgress.tsx    — SSE progress for uploaded file
  OnboardingComplete.tsx   — Completion state before redirect
```

## Step Pattern

```tsx
// OnboardingWizard.tsx — Step container
type Step = "profile" | "upload" | "complete"

const [step, setStep] = useState<Step>("profile")
const [profileName, setProfileName] = useState("")
const [uploadedSourceId, setUploadedSourceId] = useState<string | null>(null)

const handleProfileCreate = async () => {
  const profile = await apiFetch<Profile>("/v1/profiles", {
    method: "POST",
    body: JSON.stringify({ name: profileName }),
  })
  setStep("upload")
}

const handleFileUpload = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("profile_id", profile.id)
  const { source_id } = await apiUpload<{ source_id: string }>("/v1/ingest/upload", formData)
  setUploadedSourceId(source_id)
  setStep("complete")
}

return (
  <div className="max-w-md mx-auto">
    {/* Progress: 1. Create Profile  2. Upload First File */}
    <div className="flex items-center gap-2 mb-8">
      <StepIndicator label="Create Profile" active={step === "profile"} done={step !== "profile"} />
      <div className="flex-1 h-px bg-border" />
      <StepIndicator label="Upload File" active={step === "upload"} done={step === "complete"} />
    </div>

    {step === "profile" && (
      <ProfileNameStep
        value={profileName}
        onChange={setProfileName}
        onNext={handleProfileCreate}
      />
    )}
    {step === "upload" && (
      <FileUploadStep
        profileId={profile.id}
        onComplete={() => setStep("complete")}
        onSkip={() => router.push("/dashboard")}
      />
    )}
    {step === "complete" && (
      <OnboardingComplete onFinish={() => router.push("/dashboard")} />
    )}
  </div>
)
```

## Profile Name Input Pattern

```tsx
// ProfileNameStep.tsx
import { useState, useRef } from "react"

export function ProfileNameStep({ value, onChange, onNext }: ProfileNameStepProps) {
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleBlur = () => {
    setTouched(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (value.length > 0 && value.length < 2) {
        setError("Name must be at least 2 characters")
      } else {
        setError(null)
      }
    }, 300)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl">Welcome to Ravenbase.</h1>
        <p className="text-muted-foreground">Let's set up your first memory profile.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-name" className="text-sm font-medium">
          Profile name
        </label>
        <Input
          id="profile-name"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="e.g. Work, Personal, Research"
          aria-invalid={touched && !!error}
          aria-describedby={error ? "profile-name-error" : undefined}
          className={touched && error ? "border-destructive" : ""}
        />
        {touched && error && (
          <p id="profile-name-error" className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <Button
        onClick={onNext}
        disabled={value.trim().length < 2}
        className="w-full rounded-full"
        size="lg"
      >
        Continue
      </Button>
      <Button variant="ghost" onClick={() => router.push("/dashboard")} className="w-full">
        Skip for now →
      </Button>
    </div>
  )
}
```

## File Upload with react-dropzone

```tsx
// FileUploadStep.tsx
import { useDropzone } from "react-dropzone"

export function FileUploadStep({ profileId, onComplete, onSkip }: FileUploadStepProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      const formData = new FormData()
      formData.append("file", file)
      formData.append("profile_id", profileId)
      await apiUpload("/v1/ingest/upload", formData)
      onComplete()
    }
  })

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-2xl">Ready to build your memory?</h2>
        <p className="text-muted-foreground">Upload your first file or skip to explore.</p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-colors hover:border-primary
          ${isDragActive ? "border-primary bg-primary/5" : "border-border"}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm font-medium">
          {isDragActive ? "Drop your file here" : "Drag & drop a PDF or DOCX, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Maximum file size: 50MB</p>
      </div>

      <Button variant="ghost" onClick={onSkip} className="w-full">
        Skip for now →
      </Button>
    </div>
  )
}
```
