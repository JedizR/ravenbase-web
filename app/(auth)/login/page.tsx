import type { Metadata } from "next"
import { SignIn } from "@clerk/nextjs"
import { RavenbaseLockup } from "@/components/brand"

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-background"
    >
      <div className="mb-8 text-primary">
        <RavenbaseLockup size="lg" />
      </div>
      <SignIn
        path="/login"
        signUpUrl="/register"
        afterSignInUrl="/dashboard"
      />
    </main>
  )
}
