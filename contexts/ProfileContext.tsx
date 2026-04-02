"use client"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { toast } from "sonner"
import {
  createProfileV1ProfilesPost,
  deleteProfileV1ProfilesProfileIdDelete,
  listProfilesV1ProfilesGet,
  updateProfileV1ProfilesProfileIdPatch,
} from "@/src/lib/api-client/services.gen"
import type {
  ProfileCreate,
  ProfileResponse,
  ProfileUpdate,
} from "@/src/lib/api-client/types.gen"
import { useApiFetch } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  is_default: boolean
  created_at: string
}

interface ProfileContextValue {
  profiles: Profile[]
  activeProfile: Profile | null
  setActiveProfile: (profile: Profile) => void
  isLoading: boolean
  // CRUD helpers (optimistic-friendly)
  createProfile: (data: ProfileCreate) => Promise<Profile>
  updateProfile: (id: string, data: ProfileUpdate) => Promise<Profile>
  deleteProfile: (id: string) => Promise<void>
  refetchProfiles: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ProfileContext = createContext<ProfileContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ProfileContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const apiFetch = useApiFetch()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch profiles on mount — restore persisted active profile from localStorage
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await listProfilesV1ProfilesGet()
        if (cancelled) return
        const items: Profile[] = res.items as unknown as Profile[]
        setProfiles(items)

        // Try to restore persisted active profile
        let restoredProfile: Profile | null = null
        try {
          const savedId = localStorage.getItem("ravenbase-active-profile")
          if (savedId) {
            restoredProfile = items.find((p) => p.id === savedId) ?? null
          }
        } catch {
          // localStorage unavailable
        }

        const activeProfile =
          restoredProfile ??
          items.find((p) => p.is_default) ??
          items[0] ??
          null
        setActiveProfileState(activeProfile)
      } catch (err) {
        toast.error("Failed to load profiles", {
          description: err instanceof Error ? err.message : "Unknown error",
        })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const setActiveProfile = useCallback((profile: Profile) => {
    setActiveProfileState(profile)
    // Persist to localStorage so it survives page refresh
    try {
      localStorage.setItem("ravenbase-active-profile", profile.id)
    } catch {
      // localStorage unavailable
    }
  }, [])

  const refetchProfiles = useCallback(async () => {
    const res = await listProfilesV1ProfilesGet()
    const items: Profile[] = res.items as unknown as Profile[]
    setProfiles(items)
    // Keep active profile if it still exists
    setActiveProfileState((prev) => {
      if (!prev) return items[0] ?? null
      const stillExists = items.find((p) => p.id === prev.id)
      return stillExists ?? items[0] ?? null
    })
  }, [])

  const createProfile = useCallback(
    async (data: ProfileCreate): Promise<Profile> => {
      const res = await createProfileV1ProfilesPost({
        requestBody: data,
      })
      const created: Profile = res as unknown as Profile
      setProfiles((prev) => [...prev, created])
      toast.success(`Profile "${created.name}" created`)
      return created
    },
    []
  )

  const updateProfile = useCallback(
    async (id: string, data: ProfileUpdate): Promise<Profile> => {
      const res = await updateProfileV1ProfilesProfileIdPatch({
        profileId: id,
        requestBody: data,
      })
      const updated: Profile = res as unknown as Profile
      setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)))
      // Update active profile if it was the one edited
      setActiveProfileState((prev) => (prev?.id === id ? updated : prev))
      toast.success(`Profile "${updated.name}" updated`)
      return updated
    },
    []
  )

  const deleteProfile = useCallback(async (id: string): Promise<void> => {
    await deleteProfileV1ProfilesProfileIdDelete({ profileId: id })
    setProfiles((prev) => {
      const remaining = prev.filter((p) => p.id !== id)
      // If deleted profile was active, switch to first remaining (not null)
      setActiveProfileState((active) => {
        if (active?.id !== id) return active
        const fallback = remaining.find((p) => p.is_default) ?? remaining[0] ?? null
        if (fallback) {
          try { localStorage.setItem("ravenbase-active-profile", fallback.id) } catch { /* */ }
        } else {
          try { localStorage.removeItem("ravenbase-active-profile") } catch { /* */ }
        }
        return fallback
      })
      return remaining
    })
    toast.success("Profile deleted")
  }, [])

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        setActiveProfile,
        isLoading,
        createProfile,
        updateProfile,
        deleteProfile,
        refetchProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileContextProvider")
  }
  return ctx
}
