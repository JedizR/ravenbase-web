import type { Metadata } from "next"
import { MemoryChat } from "@/components/domain/MemoryChat"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ChatPage() {
  return <MemoryChat />
}
