"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Circle, Plus, Trash2 } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useProfile } from "@/contexts/ProfileContext"
import type { ProfileCreate, ProfileUpdate } from "@/src/lib/api-client/types.gen"

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const COLOR_OPTIONS = [
  "#2d4a3e", // forest green (primary)
  "#3d8b5a", // success green
  "#3f87c2", // info blue
  "#7c3aed", // violet
  "#b53233", // destructive red
  "#ffc00d", // warning amber
  "#a8c4b2", // sage
  "#6b7280", // gray
]

// ---------------------------------------------------------------------------
// Profile form dialog
// ---------------------------------------------------------------------------

interface ProfileFormState {
  name: string
  color: string
  is_default: boolean
}

interface ProfileFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ProfileCreate) => Promise<void>
  initial?: Partial<ProfileFormState>
  mode: "create" | "edit"
}

function ProfileFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initial = {},
  mode,
}: ProfileFormDialogProps) {
  const [name, setName] = useState(initial.name ?? "")
  const [color, setColor] = useState(initial.color ?? COLOR_OPTIONS[0])
  const [is_default, setIsDefault] = useState(initial.is_default ?? false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function validateName(v: string): string | null {
    if (!v.trim()) return "Profile name is required"
    if (v.trim().length < 2) return "Must be at least 2 characters"
    return null
  }

  function handleBlur() {
    setTouched(true)
    clearTimeout(blurTimerRef.current)
    blurTimerRef.current = setTimeout(() => {
      setError(validateName(name))
    }, 300)
  }

  async function handleSubmit() {
    const err = validateName(name)
    setError(err)
    setTouched(true)
    if (err) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        color,
        is_default,
      } as ProfileCreate)
      onOpenChange(false)
      setName("")
      setColor(COLOR_OPTIONS[0])
      setIsDefault(false)
      setError(null)
      setTouched(false)
    } catch (e) {
      toast.error("Failed to save profile", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create profile" : "Edit profile"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new profile to keep different areas of your life separate."
              : "Update the profile details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-name" className="text-sm font-medium">
              Profile name
            </label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleBlur}
              placeholder="e.g. Work — Full Stack"
              aria-invalid={touched && !!error}
              aria-describedby={error ? "profile-name-error" : undefined}
            />
            {touched && error && (
              <p id="profile-name-error" className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Color badge</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? "scale-125 ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                >
                  {color === c && (
                    <Circle className="w-3 h-3 text-white" fill="white" stroke="none" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Default toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDefault((v) => !v)}
              aria-pressed={is_default}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                is_default ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  is_default ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm">Set as default profile</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-full"
          >
            {isSubmitting ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfilesSettingsPage() {
  const { profiles, createProfile, updateProfile, deleteProfile, refetchProfiles } =
    useProfile()

  const [createOpen, setCreateOpen] = useState(false)
  const [editProfileId, setEditProfileId] = useState<string | null>(null)
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const editProfile = profiles.find((p) => p.id === editProfileId) ?? null

  async function handleCreate(data: ProfileCreate) {
    await createProfile(data)
  }

  async function handleEdit(data: ProfileCreate) {
    if (!editProfileId) return
    await updateProfile(editProfileId, data as ProfileUpdate)
    setEditProfileId(null)
  }

  async function handleDelete() {
    if (!deleteProfileId) return
    setIsDeleting(true)
    try {
      await deleteProfile(deleteProfileId)
      setDeleteProfileId(null)
    } catch (e) {
      toast.error("Failed to delete profile", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage system profiles to keep different areas of your life
            separate.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-full gap-2 h-11"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New profile
        </Button>
      </div>

      {/* Profile list */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {profiles.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No profiles yet. Create your first one above.
          </div>
        )}
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center gap-4 px-4 py-4 first:rounded-t-2xl last:rounded-b-2xl"
          >
            {/* Color dot */}
            {profile.color ? (
              <Circle
                className="w-4 h-4 shrink-0"
                fill={profile.color}
                stroke="none"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="w-4 h-4 shrink-0 text-muted"
                fill="currentColor"
                stroke="none"
                aria-hidden="true"
              />
            )}

            {/* Name + description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.name}</p>
              {profile.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {profile.description}
                </p>
              )}
              {profile.is_default && (
                <span className="inline-block mt-1 text-xs font-mono text-muted-foreground">
                  DEFAULT
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditProfileId(profile.id)}
                className="h-9 px-3 text-muted-foreground hover:text-foreground rounded-lg"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteProfileId(profile.id)}
                className="h-9 px-3 text-destructive hover:text-destructive rounded-lg"
                aria-label={`Delete ${profile.name}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create dialog */}
      <ProfileFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Edit dialog */}
      {editProfile && (
        <ProfileFormDialog
          open={true}
          onOpenChange={(v) => !v && setEditProfileId(null)}
          onSubmit={handleEdit}
          initial={{
            name: editProfile.name,
            color: editProfile.color ?? COLOR_OPTIONS[0],
            is_default: editProfile.is_default,
          }}
          mode="edit"
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteProfileId !== null}
        onOpenChange={(v) => !v && setDeleteProfileId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All memories associated with this
              profile will remain but won&apos;t be associated with any profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProfileId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
            >
              {isDeleting ? "Deleting…" : "Delete profile"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
