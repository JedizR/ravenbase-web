"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { OpenAPI } from "@/src/lib/api-client/core/OpenAPI"

export function Providers({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth()

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  )

  // Configure the generated API client with base URL and auth token resolver
  useEffect(() => {
    OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL ?? ""
    OpenAPI.TOKEN = async () => {
      const token = await getToken()
      return token ?? ""
    }
  }, [getToken])

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
