// lib/auth/requireAdmin.ts
//
// Use inside API route handlers (Node runtime) to re-verify the admin
// session before touching data with the service-role key. Middleware
// already blocks unauthenticated requests from reaching these routes at
// all, but routes still check independently — defense in depth, and it
// means these routes stay safe even if the middleware matcher is ever
// edited incorrectly later.

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, ADMIN_SESSION_COOKIE_NAME, AdminSessionPayload } from "./adminAuth";

export async function requireAdmin(
  req: NextRequest
): Promise<{ session: AdminSessionPayload } | { error: NextResponse }> {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminSession(token) : null;

  if (!session) {
    return {
      error: NextResponse.json({ message: "Not authenticated." }, { status: 401 }),
    };
  }

  return { session };
}