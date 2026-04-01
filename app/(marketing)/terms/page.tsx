import type { Metadata } from "next"
import { Header } from "@/components/marketing/Header"
import { Footer } from "@/components/marketing/Footer"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Ravenbase Terms of Service — The rules, rights, and responsibilities governing your use of the Ravenbase service.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Service | Ravenbase",
    description: "The rules governing your use of the Ravenbase service.",
    type: "article",
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:text-sm">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-4 sm:px-6 py-16 lg:py-24">
        <article className="prose prose-stone max-w-none">
          <h1 className="font-serif text-4xl lg:text-5xl text-foreground mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground font-mono tracking-wider mb-8">
            ◆ EFFECTIVE_DATE: 2026-03-31
          </p>

          <p className="text-base text-foreground leading-relaxed mb-8">
            Welcome to Ravenbase. These Terms of Service (&ldquo;Terms&rdquo;) are a legally binding agreement between
            Ravenbase, Inc. (&ldquo;Ravenbase,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) and you (&ldquo;you&rdquo; or &ldquo;your&rdquo;)
            governing your access to and use of the Ravenbase service accessible at ravenbase.app
            and related applications (collectively, the &ldquo;Service&rdquo;).
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">1. Acceptance of Terms</h2>
          <p className="text-base text-foreground leading-relaxed">
            By creating an account, accessing, or using the Service, you acknowledge that you have read,
            understood, and agree to be bound by these Terms. If you do not agree to these Terms, you
            may not access or use the Service. These Terms supersede all prior agreements and
            understandings between you and Ravenbase regarding this subject matter.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">2. Description of Service</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            Ravenbase is an AI-powered long-term memory and knowledge management service that:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-foreground">
            <li>Permanently captures, structures, and synthesizes user-uploaded content</li>
            <li>Builds a knowledge graph from uploaded documents, notes, and chat exports</li>
            <li>Detects conflicts between stored memories and surfaces them for resolution</li>
            <li>Generates Meta-Documents (synthesized outputs) from stored memories</li>
            <li>Provides conversational memory chat using stored knowledge</li>
          </ul>
          <p className="text-base text-foreground leading-relaxed mt-4">
            Ravenbase processes User Content using a combination of vector search (Qdrant), knowledge graph
            (Neo4j), and large language model (LLM) technologies. Processing occurs on servers operated
            by Ravenbase or our cloud infrastructure providers.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">3. Account Registration</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            To use Ravenbase, you must create an account using a valid email address. You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-foreground">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Keep your password secure and confidential</li>
            <li>Notify us immediately of any unauthorized access to your account</li>
            <li>Be responsible for all activities that occur under your account</li>
          </ul>
          <p className="text-base text-foreground leading-relaxed mt-4">
            You must be at least 16 years old to create a Ravenbase account. If you are under 16, you may
            use Ravenbase only with verifiable parental consent.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">4. Acceptable Use</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            You agree NOT to use the Service to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-foreground">
            <li>Upload, process, or store any content that is illegal, harmful, or infringing</li>
            <li>Upload content containing personally identifiable information (PII) of third parties without their consent</li>
            <li>Attempt to reverse engineer, decompile, or extract the underlying algorithms of the Service</li>
            <li>Use automated tools (scrapers, bots) to access the Service without prior written permission</li>
            <li>Resell, sublicense, or commercially exploit the Service without a signed agreement</li>
            <li>Upload content that violates any applicable law or regulation</li>
            <li>Harass, abuse, or threaten other users</li>
          </ul>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">5. Intellectual Property</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            <strong>Your Content:</strong> You retain all ownership rights to the User Content you upload
            to Ravenbase. By uploading content, you grant Ravenbase a limited, worldwide, royalty-free
            license to process, store, and analyze your content solely for the purpose of providing the
            Service to you.
          </p>
          <p className="text-base text-foreground leading-relaxed mb-4">
            <strong>Ravenbase Output:</strong> Meta-Documents and synthesized outputs generated from your
            User Content are considered your intellectual property. Ravenbase claims no ownership rights
            over these outputs.
          </p>
          <p className="text-base text-foreground leading-relaxed">
            <strong>Ravenbase Technology:</strong> The Ravenbase platform, its interfaces, trademarks,
            algorithms, and all related technology are the exclusive property of Ravenbase, Inc. You
            may not copy, modify, or create derivative works based on Ravenbase&apos;s technology.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">6. Subscription and Billing</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            Ravenbase offers Free, Pro, and Team subscription tiers. By subscribing to a paid tier:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-foreground">
            <li>You authorize Ravenbase to charge your designated payment method on a recurring basis</li>
            <li>Subscriptions auto-renew at the end of each billing period unless cancelled</li>
            <li>Credits purchased or allocated are non-transferable and expire as specified in your plan</li>
            <li>Free-tier users who exceed storage or API limits may be downgraded or have data archived</li>
            <li>You may cancel your subscription at any time through the Settings → Billing page</li>
          </ul>
          <p className="text-base text-foreground leading-relaxed mt-4">
            Refunds are provided within 7 days of a charge if you are not satisfied with the service,
            at Ravenbase&apos;s sole discretion. Contact billing@ravenbase.app for refund requests.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">7. Confidentiality</h2>
          <p className="text-base text-foreground leading-relaxed">
            Ravenbase treats all User Content as confidential. We do not use your content to train
            AI models. Your content is isolated per account and never shared with other users. Employees
            and contractors with access to user data are bound by confidentiality obligations. This
            commitment is backed by our technical architecture and contractual obligations.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">8. Disclaimer of Warranties</h2>
          <p className="text-base text-foreground leading-relaxed">
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. Ravenbase does not warrant that
            the Service will be uninterrupted, error-free, or completely secure. You acknowledge that
            you use the Service at your own risk.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">9. Limitation of Liability</h2>
          <p className="text-base text-foreground leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, RAVENBASE SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE,
            DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, REGARDLESS OF
            THE THEORY OF LIABILITY. RAVENBASE&apos;S TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM THESE TERMS
            SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO RAVENBASE IN THE TWELVE (12) MONTHS PRECEDING
            THE CLAIM.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">10. Indemnification</h2>
          <p className="text-base text-foreground leading-relaxed">
            You agree to indemnify, defend, and hold harmless Ravenbase, its officers, directors,
            employees, and agents from and against any claims, liabilities, damages, losses, and
            expenses (including reasonable legal fees) arising out of or related to: (a) your violation
            of these Terms; (b) your User Content; or (c) your use of the Service in a manner not
            permitted by these Terms.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">11. Termination</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            You may terminate your account at any time by visiting Settings → Account → Delete Account.
            Ravenbase may terminate or suspend your account immediately, without prior notice, if we
            believe you have violated these Terms or for any other legitimate business reason.
          </p>
          <p className="text-base text-foreground leading-relaxed">
            Upon termination, your right to use the Service ceases immediately. Data deletion
            procedures are described in our Privacy Policy. Free-tier inactive accounts are subject
            to the archival policy described in the Privacy Policy.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">12. Governing Law</h2>
          <p className="text-base text-foreground leading-relaxed">
            These Terms are governed by the laws of the State of California, United States, without
            regard to conflict of law provisions. Any dispute arising from these Terms shall be
            resolved exclusively in the state or federal courts located in San Francisco County,
            California, and you consent to the personal jurisdiction of those courts.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">13. Changes to Terms</h2>
          <p className="text-base text-foreground leading-relaxed">
            Ravenbase reserves the right to modify these Terms at any time. We will provide notice
            of material changes via email or in-product notification at least 30 days before the
            new Terms take effect. Your continued use of the Service after the effective date of
            revised Terms constitutes your acceptance of the revised Terms.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">14. Contact</h2>
          <p className="text-base text-foreground leading-relaxed">
            For questions regarding these Terms, contact us at:<br />
            Ravenbase, Inc.<br />
            548 Market St, Suite 60000, San Francisco, CA 94104<br />
            legal@ravenbase.app
          </p>
        </article>
      </main>
      <Footer />
    </div>
  )
}
