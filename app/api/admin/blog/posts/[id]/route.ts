import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getStaffAllowedSections } from "@/lib/auth/staffAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function canAccessBlog() {
  const admin = await getAdminSession();
  if (admin) return true;
  const allowed = await getStaffAllowedSections();
  return Boolean(allowed?.includes("blog"));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccessBlog())) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }
  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ message: error?.message || "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccessBlog())) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = { ...body };
  if (body.status === "published" && !body.published_at) {
    patch.published_at = new Date().toISOString();
  }
  const { data, error } = await supabaseAdmin.from("blog_posts").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccessBlog())) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}