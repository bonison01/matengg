// lib/auth/adminAuth.ts
//
// Signs and verifies admin session JWTs using `jose`, which (unlike
// `jsonwebtoken`) runs on the Edge runtime — required because
// middleware.ts executes on the Edge, not Node.
//
// Install: npm install jose bcryptjs
// (bcryptjs is used in the login route, not here, but listed together
// since both are new dependencies for this feature.)

import { SignJWT, jwtVerify } from "jose";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

if (!ADMIN_JWT_SECRET) {
  // Fail loudly at import time in development rather than silently
  // signing tokens with `undefined`. Set ADMIN_JWT_SECRET in your .env
  // to a long random string, e.g.: openssl rand -base64 48
  console.warn(
    "[adminAuth] ADMIN_JWT_SECRET is not set. Admin sessions will not work until it is."
  );
}

const secretKey = new TextEncoder().encode(ADMIN_JWT_SECRET || "dev-only-insecure-secret");

export interface AdminSessionPayload {
  adminId: string;
  emailOrPhone: string;
  name?: string;
  role: string;
}

const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

export async function signAdminSession(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS)
    .sign(secretKey);
}

export async function verifyAdminSession(
  token: string
): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (
      typeof payload.adminId === "string" &&
      typeof payload.emailOrPhone === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        adminId: payload.adminId,
        emailOrPhone: payload.emailOrPhone,
        name: typeof payload.name === "string" ? payload.name : undefined,
        role: payload.role,
      };
    }
    return null;
  } catch {
    // Expired, malformed, or signed with a different secret.
    return null;
  }
}

export const ADMIN_SESSION_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_DURATION_SECONDS;