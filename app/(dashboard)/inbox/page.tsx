import type { Metadata } from "next"
import { MemoryInbox } from "@/components/domain/MemoryInbox"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function InboxPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <MemoryInbox />
    </div>
  )
}
