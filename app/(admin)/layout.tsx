import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { RavenbaseLockup } from "@/components/brand"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  // AC-7: redirect non-admins silently
  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  if (!userId || !adminIds.includes(userId)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <RavenbaseLockup size="sm" />
        {/* AC-12: ◆ ADMIN_PANEL in text-destructive (RED) */}
        <span className="font-mono text-xs text-destructive tracking-wider font-bold">
          ◆ ADMIN_PANEL
        </span>
      </header>
      <main>{children}</main>
    </div>
  )
}