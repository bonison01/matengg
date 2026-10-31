// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out." });
  res.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0, // expire immediately
  });
  return res;
}