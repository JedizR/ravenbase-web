import type { Metadata } from "next"
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
export default function InboxPage() {
  return (
    <div className="flex flex-col items-center justify-center
                    h-[60vh] gap-4 text-center p-6">
      <span className="text-xs font-mono text-muted-foreground
                       tracking-wider">
        ◆ COMING_SOON
      </span>
      <h1 className="font-serif text-3xl">Memory Inbox</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        Conflict resolution is coming in the next update.
      </p>
    </div>
  )
}
