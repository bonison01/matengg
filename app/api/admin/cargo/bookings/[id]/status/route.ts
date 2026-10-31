// app/api/admin/cargo/bookings/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_STATUSES = ["Pending", "Out for Delivery", "Delivered"] as const;
type BookingStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status: BookingStatus };

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ message: "Invalid status value." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("cargo_bookings")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}