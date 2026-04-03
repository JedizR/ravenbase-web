import type { Metadata } from "next"
import { DM_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/app/providers"
import "./globals.css"

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" })
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display", display: "swap" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Ravenbase — What happened, where, and when. Always.",
    template: "%s | Ravenbase",
  },
  description:
    "Ravenbase permanently captures, structures, and synthesizes your knowledge. AI memory that never forgets, never overwrites, always cites its sources.",
  keywords: ["AI memory", "knowledge graph", "personal knowledge management"],
  authors: [{ name: "Ravenbase" }],
  creator: "Ravenbase",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    siteName: "Ravenbase",
    title: "Ravenbase — What happened, where, and when. Always.",
    description:
      "Your knowledge, permanently captured and instantly queryable.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ravenbase — What happened, where, and when. Always.",
    description: "Your knowledge, permanently captured and instantly queryable.",
    images: ["/og-image.png"],
    creator: "@ravenbase",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${dmSans.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
        <head>
          {/* No-flash blocking script — must be first in <head> */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function() {
  try {
    if (localStorage.getItem('ravenbase-theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
      `,
            }}
          />
          <link rel="preconnect" href="https://clerk.accounts.dev" />
          <link rel="preconnect" href="https://img.clerk.com" />
          <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
        </head>
        <body className="font-sans antialiased scroll-smooth" suppressHydrationWarning>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:text-sm"
          >
            Skip to main content
          </a>
          <Providers>{children}</Providers>
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
