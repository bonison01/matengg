// app/api/admin/signup/route.ts
//
// PUBLIC route — no session required, since this is how a brand-new
// admin account gets created in the first place. The account is created
// with verified = false and CANNOT log in (see /api/admin/login) until
// an existing verified admin approves it from /admin/team.
//
// This route must stay in PUBLIC_PATHS in middleware.ts, same as
// /api/admin/login, or nobody could ever sign up.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { emailOrPhone, password, name } = await req.json();

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { message: "Email/phone and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check for an existing account with this email/phone — give a
    // generic message either way to avoid confirming which accounts exist.
    const { data: existing } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("email_or_phone", emailOrPhone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: "Could not create account with these details." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { error } = await supabaseAdmin.from("admins").insert({
      email_or_phone: emailOrPhone,
      password_hash: passwordHash,
      name: name || null,
      role: "admin",
      verified: false, // requires approval from an existing verified admin
    });

    if (error) {
      console.error("Admin signup error:", error);
      return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
    }

    return NextResponse.json({
      message: "Account created. An existing admin needs to approve your access before you can log in.",
    });
  } catch (err) {
    console.error("Admin signup error:", err);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}