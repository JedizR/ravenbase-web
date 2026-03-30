import { Workstation } from "@/components/domain/Workstation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function WorkstationPage() {
  return <Workstation />
}
