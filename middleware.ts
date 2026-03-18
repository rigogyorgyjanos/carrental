// proxy.ts
import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const url = req.nextUrl.clone()

  if (!token) {
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (url.pathname.startsWith("/admin") && token.role !== "ADMIN") {
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}