import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/* -------------------------------------------------------
   SAFE Supabase Admin Factory
------------------------------------------------------- */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("supabaseUrl is required");
  }

  return createClient(supabaseUrl, serviceKey);
}

/* -------------------------------------------------------
   GET Handler
------------------------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const formid = searchParams.get("formid");

    if (!token || !formid) {
      return new NextResponse("Invalid link", { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1️⃣ Fetch contract
    const { data: contract, error: fetchErr } = await supabase
      .from("employee_contracts")
      .select("*")
      .eq("agreement_token", token)
      .eq("formid", formid)
      .maybeSingle();

    if (fetchErr) {
      console.error("Fetch error:", fetchErr);
      return new NextResponse("Error fetching contract", { status: 500 });
    }

    if (!contract) {
      return new NextResponse("Invalid or expired link", { status: 404 });
    }

    // 2️⃣ Prepare acceptance info
    const now = new Date().toISOString();
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 3️⃣ Update DB
    const { error: updateErr } = await supabase
      .from("employee_contracts")
      .update({
        agreement_accepted: true,
        agreement_accepted_at: now,
        agreement_ip: ip,
      })
      .eq("formid", formid);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new NextResponse("Error updating agreement", { status: 500 });
    }

    // 4️⃣ Success HTML
    return new NextResponse(
      `
      <html>
        <body style="font-family:Arial;display:flex;justify-content:center;align-items:center;height:100vh;">
          <div style="text-align:center;padding:40px;border:1px solid #ddd;border-radius:10px;max-width:500px;">
            <h1>Thank you — Offer Accepted</h1>
            <p>We have recorded your agreement successfully.</p>
            <p>Our HR team will now contact you with next steps.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (err: any) {
    console.error("❌ Agree route error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
