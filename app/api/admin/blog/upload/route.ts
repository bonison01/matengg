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

export async function POST(req: Request) {
  if (!(await canAccessBlog())) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ message: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage.from("blog-media").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from("blog-media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}