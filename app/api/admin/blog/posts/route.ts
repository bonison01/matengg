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

export async function GET() {
  if (!(await canAccessBlog())) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("id, slug, title, status, author_name, category, pinned, updated_at, created_at")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  if (!(await canAccessBlog())) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }
  const body = await req.json();
  const payload = {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt ?? null,
    content: body.content ?? "",
    cover_image_url: body.cover_image_url ?? null,
    tags: body.tags ?? [],
    category: body.category ?? null,
    pinned: Boolean(body.pinned),
    status: body.status === "published" ? "published" : "draft",
    author_name: body.author_name ?? null,
    published_at: body.status === "published" ? new Date().toISOString() : null,
  };
  const { data, error } = await supabaseAdmin.from("blog_posts").insert(payload).select("id").single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}