import type { Metadata } from "next"
import { DM_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL("https://ravenbase.app"),
  title: {
    default: "Ravenbase — Your Permanent Memory",
    template: "%s | Ravenbase",
  },
  description:
    "Ravenbase is a Human-AI Long-Term Context Memory System. Capture, structure, and synthesize your knowledge permanently.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${dmSans.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}
      >
        <body className="font-sans antialiased">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:text-sm"
          >
            Skip to main content
          </a>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
