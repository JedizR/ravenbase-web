import { Header } from "@/components/marketing/Header"
import { Footer } from "@/components/marketing/Footer"
import { CookieConsent } from "@/components/marketing/CookieConsent"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <CookieConsent />
      {children}
      <Footer />
    </>
  )
}