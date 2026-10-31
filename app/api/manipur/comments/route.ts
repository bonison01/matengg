// app/api/manipur/comments/route.ts
import { NextResponse } from "next/server";
import { admin, clean, cleanText, clientIp, isUuid, limited } from "@/lib/manipur/server";

export const runtime = "nodejs";

// GET /api/manipur/comments            -> approved general page reviews
// GET /api/manipur/comments?entry_id=… -> approved comments on one entry
export async function GET(req: Request) {
  const entryId = new URL(req.url).searchParams.get("entry_id");
  if (entryId && !isUuid(entryId)) return NextResponse.json({ comments: [] });

  try {
    let q = admin()
      .from("manipur_comments")
      .select("id,author_name,rating,body,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(100);
    q = entryId ? q.eq("entry_id", entryId) : q.is("entry_id", null);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ comments: data ?? [] });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

// Stored as "pending" until you approve it.
export async function POST(req: Request) {
  if (limited(`comment:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many comments. Please try again later." }, { status: 429 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot
  if (clean(payload.website, 50)) return NextResponse.json({ ok: true });

  const author = clean(payload.author_name, 80);
  const body = cleanText(payload.body, 1000);
  const ratingNum = Number(payload.rating);
  const rating = Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5 ? ratingNum : null;
  const entryId = payload.entry_id ?? null;

  if (!author) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (body.length < 2) return NextResponse.json({ error: "Please write a comment." }, { status: 400 });
  if (entryId !== null && !isUuid(entryId)) {
    return NextResponse.json({ error: "Invalid entry." }, { status: 400 });
  }

  try {
    const db = admin();
    if (entryId) {
      const { data } = await db
        .from("manipur_entries")
        .select("id")
        .eq("id", entryId)
        .eq("status", "approved")
        .maybeSingle();
      if (!data) return NextResponse.json({ error: "That entry is not available." }, { status: 404 });
    }
    const { error } = await db.from("manipur_comments").insert({
      entry_id: entryId,
      author_name: author,
      rating,
      body,
      status: "approved", // Change to "pending" if you want to moderate comments before they appear. 
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save your comment. Please try again." }, { status: 500 });
  }
}