// app/api/admin/cargo/customers/[id]/detail/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const [{ data: bookings, error: bErr }, { data: payments, error: pErr }] = await Promise.all([
    supabaseAdmin
      .from("cargo_bookings")
      .select(
        // Added sender_name/sender_address/receiver_name/receiver_address so
        // the customer-detail bookings table can show a trimmed
        // sender → receiver summary in its Description column.
        // No separate invoice_number column exists yet — the frontend falls
        // back to tracking_id as the invoice reference until one is added.
        "id,tracking_id,product_name,estimate_charge,final_charge,payment_status,amount_paid,status,created_at,sender_name,sender_address,receiver_name,receiver_address"
      )
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("cargo_payments")
      .select("*")
      .eq("customer_id", id)
      .order("paid_at", { ascending: false }),
  ]);

  if (bErr || pErr) {
    console.error("Customer detail fetch error:", bErr || pErr);
    return NextResponse.json(
      { message: (bErr || pErr)?.message || "Could not load customer detail." },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { bookings: bookings ?? [], payments: payments ?? [] } });
}