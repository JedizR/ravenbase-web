import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function middleware() {
  const { userId } = await auth()
  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  if (!userId || !adminIds.includes(userId)) {
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}