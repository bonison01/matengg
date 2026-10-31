// app/api/admin/cargo/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Added so the new /admin/cargo/customers/[id] route can fetch a single
// customer's core record directly by URL, instead of that data only being
// reachable via the full list endpoint + client-side state.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("cargo_customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Customer fetch error:", error);
    return NextResponse.json(
      { message: error.message || "Could not load customer." },
      { status: error.code === "PGRST116" ? 404 : 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { name, phone, address, city_state, pincode } = await req.json();

  if (!name?.trim() || !phone?.trim() || !address?.trim()) {
    return NextResponse.json(
      { message: "Name, phone and address are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("cargo_customers")
    .update({ name, phone, address, city_state, pincode })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Customer update error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const { error } = await supabaseAdmin.from("cargo_customers").delete().eq("id", id);

  if (error) {
    console.error("Customer delete error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Customer removed." });
}