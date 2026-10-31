// app/api/admin/pending/[id]/verify/route.ts
//
// Approves a pending admin (sets verified = true). Only a currently
// logged-in, already-verified admin can call this — enforced by
// middleware.ts (cookie must exist and be valid) + requireAdmin here.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("admins")
    .update({ verified: true })
    .eq("id", id);

  if (error) {
    console.error("Admin verify error:", error);
    return NextResponse.json({ message: error.message || "Could not approve admin." }, { status: 500 });
  }

  return NextResponse.json({ message: "Admin approved." });
}