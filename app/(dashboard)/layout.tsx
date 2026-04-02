"use client"

import { Suspense, useState } from "react"
import { Toaster } from "sonner"
import { Providers } from "@/app/providers"
import { DashboardHeader } from "@/components/domain/DashboardHeader"
import { MobileSidebar } from "@/components/domain/MobileSidebar"
import { ProfileContextProvider } from "@/contexts/ProfileContext"
import { Sidebar } from "@/components/domain/Sidebar"
import { CheckoutSuccessHandler } from "@/components/dashboard/CheckoutSuccessHandler"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
