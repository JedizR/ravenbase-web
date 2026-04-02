"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function CheckoutSuccessHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      // Invalidate stale data immediately so Sidebar + Settings show new state
      queryClient.invalidateQueries({ queryKey: ["credits"] })
      queryClient.invalidateQueries({ queryKey: ["users", "me"] })

      toast.success("Welcome to Pro. Your subscription is active.")
      // Redirect to billing page so user sees confirmation of their upgrade
      router.replace("/settings/billing", { scroll: false })
    }
  }, [searchParams, router, queryClient])

  return null
}
