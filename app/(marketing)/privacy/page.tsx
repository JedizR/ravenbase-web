import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Ravenbase Privacy Policy — How we collect, use, and protect your personal data. Your knowledge remains yours.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | Ravenbase",
    description: "How Ravenbase collects, uses, and protects your personal data.",
    type: "article",
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:text-sm">
        Skip to main content
      </a>
      <main id="main-content" className="mx-auto max-w-3xl px-4 sm:px-6 py-16 lg:py-24">
        <article className="prose prose-stone max-w-none">
          <h1 className="font-serif text-4xl lg:text-5xl text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground font-mono tracking-wider mb-8">
            ◆ EFFECTIVE_DATE: 2026-03-31
          </p>

          <p className="text-base text-foreground leading-relaxed mb-8">
            Ravenbase, Inc. (&ldquo;Ravenbase,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the
            website ravenbase.app and related services. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our service.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">1. Information We Collect</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            We collect information you provide directly to us, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-foreground">
            <li><strong>Account information:</strong> Name, email address, and authentication credentials when you create a Ravenbase account.</li>
            <li><strong>Content you upload:</strong> Documents, notes, chat exports, and other materials you submit for processing (&ldquo;User Content&rdquo;).</li>
            <li><strong>Profile data:</strong> System Profile names and configurations you create within Ravenbase.</li>
            <li><strong>Usage data:</strong> Interactions with the service, including pages visited, features used, and timestamped activity logs.</li>
            <li><strong>Communications:</strong> Information you provide when contacting us for support or feedback.</li>
          </ul>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">2. How We Use Your Information</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-foreground">
            <li>Provide, maintain, and improve our services</li>
            <li>Process and analyze your uploaded content to extract knowledge graphs and generate Meta-Documents</li>
            <li>Detect and resolve memory conflicts as described in our service</li>
            <li>Send you service-related communications (ingestion complete, conflict detected, low credits)</li>
            <li>Enforce our Terms of Service and prevent abuse</li>
          </ul>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">3. Information Sharing</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            Ravenbase does not sell, trade, or rent your personal information to third parties. We may share information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-foreground">
            <li>With service providers who assist in operating our platform (hosting, analytics, payment processing)</li>
            <li>When required by law, subpoena, or court order</li>
            <li>To protect the rights, property, or safety of Ravenbase, our users, or the public</li>
            <li>In connection with a merger, acquisition, or sale of assets (data would be transferred under the same privacy commitments)</li>
          </ul>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">4. Data Retention</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            We retain your account information for as long as your account is active. User Content is retained until you delete it or your account is deleted. After deletion, data is purged from our systems within 30 days, except where retention is required by law. Free-tier users who are inactive for 12 consecutive months may have their data archived per our data lifecycle policy.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">5. Data Security</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            We implement industry-standard encryption (TLS 1.2+ in transit, AES-256 at rest), role-based access controls, and regular third-party security audits. No method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">6. Your Rights</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-foreground">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your account and all associated data (GDPR Article 17)</li>
            <li><strong>Portability:</strong> Request your data in a machine-readable format (JSON/ZIP)</li>
            <li><strong>Object:</strong> Object to processing of your personal data for certain purposes</li>
          </ul>
          <p className="text-base text-foreground leading-relaxed mt-4">
            To exercise any of these rights, visit Settings → Data or contact privacy@ravenbase.app. We respond to all requests within 30 days.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">7. Children&apos;s Privacy</h2>
          <p className="text-base text-foreground leading-relaxed">
            Ravenbase is not directed to individuals under 16. We do not knowingly collect personal information from children. If we learn that we have collected personal information from a child under 16, we will delete that data immediately.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">8. International Transfers</h2>
          <p className="text-base text-foreground leading-relaxed">
            Ravenbase is hosted on AWS US-West-2. If you are located outside the United States, your information is transferred to and processed in the United States, which may have different data protection laws. We use Standard Contractual Clauses (SCCs) where required for cross-border transfers.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">9. Changes to This Policy</h2>
          <p className="text-base text-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the &ldquo;Effective Date&rdquo; above. For significant changes, we will provide additional notice via email or in-product notification.
          </p>

          <h2 className="font-serif text-2xl text-foreground mt-10 mb-4">10. Contact</h2>
          <p className="text-base text-foreground leading-relaxed">
            Ravenbase, Inc.<br />
            Attn: Privacy Team<br />
            548 Market St, Suite 60000, San Francisco, CA 94104<br />
            privacy@ravenbase.app
          </p>
        </article>
      </main>
    </div>
  )
}
