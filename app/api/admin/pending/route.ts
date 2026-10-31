// app/api/admin/pending/route.ts
//
// Returns every admin row (both verified and pending) so /admin/team can
// show the full roster plus an approve action for pending ones. Gated by
// middleware.ts + requireAdmin — only a logged-in (i.e. already-verified)
// admin can view this.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  // Never return password_hash to the client.
  const { data, error } = await supabaseAdmin
    .from("admins")
    .select("id, email_or_phone, name, role, verified, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin list fetch error:", error);
    return NextResponse.json({ message: error.message || "Could not load admins." }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}