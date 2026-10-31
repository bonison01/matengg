// app/api/admin/logout/route.ts
//
// IMPORTANT: the attributes here (httpOnly, secure, sameSite, path) must
// match exactly what was used when the cookie was SET in
// /api/admin/login, or some browsers won't recognize this as clearing
// the same cookie and the original session will silently survive.

import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out." });
  res.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // expire immediately
  });
  return res;
}