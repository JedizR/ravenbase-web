// app/(marketing)/pricing/page.tsx
import type { Metadata } from "next"
import Script from "next/script"
import { Header } from "@/components/marketing/Header"
import { Footer } from "@/components/marketing/Footer"
import { PricingSection } from "@/components/marketing/PricingSection"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Ravenbase pricing: Free forever, Pro at $15/month, Team at $49/month. " +
    "Permanent AI memory with knowledge graph and conflict resolution.",
  openGraph: {
    title: "Pricing | Ravenbase",
    description: "Free, Pro ($15/mo), Team ($49/mo). Start building your knowledge graph today.",
    url: "https://ravenbase.app/pricing",
  },
  twitter: {
    title: "Pricing | Ravenbase",
    description: "Free, Pro ($15/mo), Team ($49/mo). Start building your knowledge graph today.",
  },
  robots: { index: true, follow: true },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Ravenbase",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    {
      "@type": "Offer",
      price: "15",
      priceCurrency: "USD",
      name: "Pro",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
    },
    {
      "@type": "Offer",
      price: "49",
      priceCurrency: "USD",
      name: "Team",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
    },
  ],
}

export default function PricingPage() {
  return (
    <>
      <Script
        id="pricing-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
                   focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground
                   focus:rounded-md focus:font-medium focus:text-sm"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content">
        <PricingSection />
      </main>
      <Footer />
    </>
  )
}
