import type { Appearance } from "@clerk/types"

/**
 * Clerk appearance config matching Ravenbase design system.
 * Forces light mode on auth pages regardless of system theme.
 * Uses the brand's forest green primary and warm cream background.
 */
export const CLERK_APPEARANCE: Appearance = {
  variables: {
    colorPrimary: "#2d4a3e",
    colorBackground: "#ffffff",
    colorText: "#1a1a1a",
    colorTextSecondary: "#6b7280",
    colorInputBackground: "#ffffff",
    colorInputText: "#1a1a1a",
    borderRadius: "0.75rem",
    fontFamily: "'DM Sans', sans-serif",
  },
  elements: {
    rootBox: "w-full max-w-md",
    card: "bg-white shadow-lg rounded-2xl border border-[#d1d5db]",
    headerTitle: "font-serif text-2xl text-[#1a1a1a]",
    headerSubtitle: "text-[#6b7280]",
    socialButtonsBlockButton:
      "border border-[#d1d5db] hover:bg-[#e8ebe6] transition-colors rounded-xl",
    formButtonPrimary:
      "bg-[#2d4a3e] hover:bg-[#3d6454] text-white rounded-full transition-colors",
    formFieldInput:
      "border-[#d1d5db] focus:border-[#2d4a3e] focus:ring-[#2d4a3e]/20 rounded-lg",
    footerActionLink: "text-[#2d4a3e] hover:text-[#3d6454]",
    identityPreviewEditButton: "text-[#2d4a3e]",
  },
}
