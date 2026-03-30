import type { Metadata } from "next"
import { Providers } from "@/app/providers"
import { OnboardingWizard } from "@/components/domain/OnboardingWizard"

export const metadata: Metadata = {
  title: "Get Started",
  robots: { index: false, follow: false },
}

export default function OnboardingPage() {
  return (
    <Providers>
      <OnboardingWizard />
    </Providers>
  )
}
