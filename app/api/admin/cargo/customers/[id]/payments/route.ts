// app/api/admin/cargo/customers/[id]/payments/route.ts
//
// Records a payment from a frequent customer and distributes it
// oldest-first across their unpaid / partial bookings.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id: customerId } = await params;
  const body = await req.json();
  const amount: number = parseFloat(body.amount);
  const note: string = body.note ?? "";

  if (!amount || amount <= 0) {
    return NextResponse.json({ message: "Invalid amount." }, { status: 400 });
  }

  // Insert the top-level payment record
  const { data: paymentRow, error: payErr } = await supabaseAdmin
    .from("cargo_payments")
    .insert({ customer_id: customerId, amount, note })
    .select()
    .single();

  if (payErr) {
    console.error("Payment insert error:", payErr);
    return NextResponse.json({ message: payErr.message }, { status: 500 });
  }

  // Distribute the payment across unpaid/partial bookings, oldest first
  const { data: unpaidBookings, error: bErr } = await supabaseAdmin
    .from("cargo_bookings")
    .select("id, estimate_charge, final_charge, amount_paid, payment_status")
    .eq("customer_id", customerId)
    .in("payment_status", ["unpaid", "partial"])
    .order("created_at", { ascending: true });

  if (bErr) {
    console.error("Unpaid bookings fetch error:", bErr);
    // Payment row was saved — don't fail the whole request
    return NextResponse.json({ data: paymentRow });
  }

  let remaining = amount;
  for (const booking of unpaidBookings ?? []) {
    if (remaining <= 0) break;

    const charge = (booking.final_charge ?? booking.estimate_charge) as number;
    const alreadyPaid = (booking.amount_paid ?? 0) as number;
    const due = Math.max(0, charge - alreadyPaid);
    if (due <= 0) continue;

    const applying = Math.min(remaining, due);
    const newPaid = alreadyPaid + applying;
    const newStatus: "paid" | "partial" | "unpaid" =
      newPaid >= charge ? "paid" : newPaid > 0 ? "partial" : "unpaid";

    const { error: uErr } = await supabaseAdmin
      .from("cargo_bookings")
      .update({ amount_paid: newPaid, payment_status: newStatus })
      .eq("id", booking.id);

    if (uErr) {
      console.warn(`Could not update booking ${booking.id}:`, uErr.message);
    } else {
      remaining -= applying;
    }
  }

  return NextResponse.json({ data: paymentRow }, { status: 201 });
}