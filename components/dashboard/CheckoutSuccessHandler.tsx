"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

export function CheckoutSuccessHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Welcome to Pro. Your subscription is active.")
      // Remove the query param without a full page reload
      router.replace("/chat", { scroll: false })
    }
  }, [searchParams, router])

  return null
}
