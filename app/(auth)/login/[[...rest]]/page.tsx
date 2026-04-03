import type { Metadata } from "next"
import { SignIn } from "@clerk/nextjs"
import { RavenbaseLockup } from "@/components/brand"
import { CLERK_APPEARANCE } from "@/app/(auth)/clerk-theme"

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f5f3ee]"
    >
      <a href="/" className="text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors mb-6">
        ← Back to Ravenbase
      </a>
      <div className="mb-8 text-[#2d4a3e]">
        <RavenbaseLockup size="lg" />
      </div>
      <SignIn
        path="/login"
        signUpUrl="/register"
        fallbackRedirectUrl="/chat"
        appearance={CLERK_APPEARANCE}
      />
    </main>
  )
}
