import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"
import { RavenbaseLockup } from "@/components/brand"

export const metadata: Metadata = {
  title: "Sign Up",
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-background"
    >
      <div className="mb-8 text-primary">
        <RavenbaseLockup size="lg" />
      </div>
      <SignUp
        path="/register"
        signInUrl="/login"
        afterSignUpUrl="/dashboard"
      />
    </main>
  )
}
