import type { Metadata } from "next"
import Script from "next/script"
import { HeroSection } from "@/components/marketing/HeroSection"
import { WorkflowSection } from "@/components/marketing/WorkflowSection"
import { FeaturesSection } from "@/components/marketing/FeaturesSection"
import { FeatureDeepDive } from "@/components/marketing/FeatureDeepDive"
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection"
import { FAQSection } from "@/components/marketing/FAQSection"
import { PricingSection } from "@/components/marketing/PricingSection"
import { CTASection } from "@/components/marketing/CTASection"

export const metadata: Metadata = {
  title: "Ravenbase — Your Permanent Memory",
  description:
    "Capture, structure, and synthesize years of notes into a permanent, queryable knowledge graph. Ravenbase is the episodic memory layer for long-term thinkers.",
  openGraph: {
    type: "website",
    url: "https://ravenbase.app",
    title: "Ravenbase — Your Permanent Memory",
    description:
      "Years of scattered notes → one structured memory. Ravenbase captures, structures, and surfaces everything you've ever known.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Ravenbase — AI Memory System" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ravenbase — Your Permanent Memory",
    description: "Years of scattered notes → one structured memory.",
    images: ["/og-image.png"],
    creator: "@ravenbase",
  },
  alternates: { canonical: "https://ravenbase.app" },
}

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Ravenbase",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  description:
    "Human-AI long-term context memory. Capture, structure, and synthesize your knowledge permanently.",
  url: "https://ravenbase.app",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Starter" },
    {
      "@type": "Offer",
      price: "12",
      priceCurrency: "USD",
      name: "Pro",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      <Script
        id="json-ld-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        strategy="afterInteractive"
      />
      <main id="main-content" tabIndex={-1} className="bg-background">
        <HeroSection />
        <WorkflowSection />
        <FeaturesSection />
        <FeatureDeepDive />
        <TestimonialsSection />
        <FAQSection />
        <section id="pricing" aria-labelledby="pricing-heading" className="py-24 bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <PricingSection />
          </div>
        </section>
        <CTASection />
      </main>
    </>
  )
}
