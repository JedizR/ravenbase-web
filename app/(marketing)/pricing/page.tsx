import { redirect } from "next/navigation"

export default function PricingPage() {
  redirect("/#pricing")
}

export const metadata = {
  title: "Pricing",
  robots: { index: false, follow: true },
}
