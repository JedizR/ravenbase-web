"use client"

import { Suspense, useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Toaster } from "sonner"
import { Providers } from "@/app/providers"
import { DashboardHeader } from "@/components/domain/DashboardHeader"
import { MobileSidebar } from "@/components/domain/MobileSidebar"
import { ProfileContextProvider } from "@/contexts/ProfileContext"
import { Sidebar } from "@/components/domain/Sidebar"
import { CheckoutSuccessHandler } from "@/components/dashboard/CheckoutSuccessHandler"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardSkeleton() {
  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-60 bg-primary shrink-0" />
      {/* Content skeleton */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-14 border-b border-border bg-background px-4 flex items-center">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile sidebar when user navigates to a new page
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace("/login")
    }
  }, [isLoaded, userId, router])

  // Show skeleton while Clerk loads auth state
  if (!isLoaded) {
    return <DashboardSkeleton />
  }

  // After Clerk loads, if no user, show nothing (redirect is in-flight)
  if (!userId) {
    return <DashboardSkeleton />
  }

  return (
    <ProfileContextProvider>
      <Providers>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:text-sm"
        >
          Skip to main content
        </a>
        <div className="flex h-[100dvh] bg-background overflow-hidden">
          {/* Desktop sidebar — hidden on mobile */}
          <div className="hidden lg:block shrink-0">
            <Sidebar />
          </div>

          {/* Main content area */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <DashboardHeader onMenuOpen={() => setMobileNavOpen(true)} />
            <main
              id="main-content"
              className="flex-1 overflow-y-auto"
              tabIndex={-1}
            >
              <Suspense fallback={null}>
                <CheckoutSuccessHandler />
              </Suspense>
              {children}
            </main>
            {/* Sonner toast notifications — richColors for semantic variants */}
            <Toaster richColors position="bottom-right" />
          </div>

          {/* Mobile sidebar drawer */}
          <MobileSidebar
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
        </div>
      </Providers>
    </ProfileContextProvider>
  )
}
