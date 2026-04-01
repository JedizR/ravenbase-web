import type { Metadata } from "next"
import { DM_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Providers } from "@/app/providers"
import "./globals.css"

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" })
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display", display: "swap" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL("https://ravenbase.app"),
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
    url: "https://ravenbase.app",
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
      >
        <head>
          {/* No-flash blocking script — must be first in <head> */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function() {
  try {
    var s = localStorage.getItem('ravenbase-theme');
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (s === 'dark' || (!s && d)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
      `,
            }}
          />
          <link rel="preconnect" href="https://clerk.accounts.dev" />
          <link rel="preconnect" href="https://img.clerk.com" />
          <link rel="dns-prefetch" href="https://api.ravenbase.app" />
        </head>
        <body className="font-sans antialiased scroll-smooth" suppressHydrationWarning>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:text-sm"
          >
            Skip to main content
          </a>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
