// middleware.ts
// Place this file at the project root (same level as package.json),
// NOT inside /app. This REPLACES your existing middleware.ts.
//
// Runs on Next.js's Edge runtime, before any /admin/* page, or any
// /api/admin/* route, executes.

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";

// Paths that must stay reachable WITHOUT a session — login and signup
// (both the pages and their API routes), or nobody could ever get in.
const PUBLIC_PATHS = [
  "/admin/login",
  "/admin/signup",
  "/api/admin/login",
  "/api/admin/signup",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminSession(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
    }

    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};