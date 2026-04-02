import type { Metadata } from "next"
import { PricingSection } from "@/components/marketing/PricingSection"

export const metadata: Metadata = {
  title: "Pricing — Ravenbase",
  description:
    "Start free. Upgrade to Pro for unlimited sources, Meta-Documents, and Claude Sonnet access.",
  openGraph: {
    type: "website",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pricing`,
    title: "Pricing — Ravenbase",
    description:
      "Start free. Upgrade to Pro for unlimited sources, Meta-Documents, and Claude Sonnet access.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Ravenbase Pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Ravenbase",
    description: "Start free. Upgrade to Pro for unlimited sources, Meta-Documents, and Claude Sonnet access.",
    images: ["/og-image.png"],
    creator: "@ravenbase",
  },
  robots: { index: true, follow: true },
}

export default function PricingPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:text-sm"
      >
        Skip to main content
      </a>
      <main id="main-content" className="bg-background min-h-screen">
        <section id="pricing" aria-labelledby="pricing-heading" className="py-24 bg-background">
          <div className="mx-auto max-w-5xl px-6">
            <PricingSection />
          </div>
        </section>
      </main>
    </>
  )
}
