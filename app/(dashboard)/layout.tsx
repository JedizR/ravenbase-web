"use client"

import { useState } from "react"
import { Toaster } from "sonner"
import { Providers } from "@/app/providers"
import { DashboardHeader } from "@/components/domain/DashboardHeader"
import { MobileSidebar } from "@/components/domain/MobileSidebar"
import { ProfileContextProvider } from "@/contexts/ProfileContext"
import { Sidebar } from "@/components/domain/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <ProfileContextProvider>
      <Providers>
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
