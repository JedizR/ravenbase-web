import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/onboarding(.*)",
  "/pricing",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/api/webhooks/clerk(.*)",
  "/api/webhooks/stripe(.*)",
])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()

  // Authenticated users visiting landing page → redirect to app
  if (userId && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  // Unauthenticated users visiting protected routes → login
  if (!isPublicRoute(request) && !userId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
