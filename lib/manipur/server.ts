// lib/manipur/server.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only helpers for the Manipur community API routes.

// Untyped client (no generated Database types), so inserts/selects on any
// table type-check instead of resolving to `never`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, "public", any>;
let client: Db | null = null;

export function admin(): Db {
  if (!client) {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    client = createClient(url, key, { auth: { persistSession: false } }) as unknown as Db;
  }
  return client;
}

// Simple in-memory rate limit. Good enough to stop casual spam; on serverless
// each instance keeps its own counter, so use a shared store if abuse grows.
const hits = new Map<string, number[]>();
export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

/** Single-line text: collapse whitespace, trim, cap length. */
export const clean = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Multi-line text: keep line breaks, trim, cap length. */
export const cleanText = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, max) : "";

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Detects the real image type from the first bytes (not the file name). */
export function sniffImage(buf: Buffer): { ext: string; type: string } | null {
  if (buf.length > 12) {
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
      return { ext: "png", type: "image/png" };
    if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP")
      return { ext: "webp", type: "image/webp" };
  }
  return null;
}