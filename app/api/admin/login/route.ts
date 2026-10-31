// app/api/admin/login/route.ts
//
// Same as before, with one addition: an admin row that exists but has
// verified = false (i.e. signed up but not yet approved by an existing
// admin) is rejected with a clear message instead of being let in.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/adminAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { emailOrPhone, password } = await req.json();

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { message: "Email/phone and password are required." },
        { status: 400 }
      );
    }

    const { data: admin, error } = await supabaseAdmin
      .from("admins")
      .select("id, email_or_phone, password_hash, name, role, verified")
      .eq("email_or_phone", emailOrPhone)
      .maybeSingle();

    if (error) {
      console.error("Admin login lookup error:", error);
      return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
    }

    const genericFailure = NextResponse.json(
      { message: "Invalid credentials." },
      { status: 401 }
    );

    if (!admin) return genericFailure;

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) return genericFailure;

    // Credentials are correct, but the account hasn't been approved yet.
    // Deliberately a DIFFERENT message than "invalid credentials" — the
    // person needs to know to go ask someone for approval, not retype
    // their password.
    if (!admin.verified) {
      return NextResponse.json(
        { message: "Your account is awaiting approval from an existing admin." },
        { status: 403 }
      );
    }

    const token = await signAdminSession({
      adminId: admin.id,
      emailOrPhone: admin.email_or_phone,
      name: admin.name ?? undefined,
      role: admin.role,
    });

    const res = NextResponse.json({
      message: "Login successful.",
      data: { name: admin.name, role: admin.role },
    });

    res.cookies.set(ADMIN_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return res;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}