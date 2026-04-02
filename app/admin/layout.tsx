import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { RavenbaseLockup } from "@/components/brand"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  if (!userId || !adminIds.includes(userId)) {
    redirect("/chat")
  }

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
                   focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground
                   focus:rounded-md focus:font-medium focus:text-sm"
      >
        Skip to main content
      </a>
      <header className="border-b border-border bg-card">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-1 h-8 bg-destructive rounded-full" />
          <RavenbaseLockup size="sm" />
          {/* AC-12: ◆ ADMIN_PANEL in text-destructive (RED) */}
          <span className="font-mono text-xs text-destructive tracking-wider font-bold">
            ◆ ADMIN_PANEL
          </span>
        </div>
      </header>
      <main id="main-content">{children}</main>
    </div>
  )
}
