// app/api/manipur/entries/route.ts
import { NextResponse } from "next/server";
import { CATEGORIES } from "@/components/manipur/categories";
import { admin, clean, cleanText, clientIp, limited, sniffImage } from "@/lib/manipur/server";

export const runtime = "nodejs";

const MAX_PHOTOS = 4;
const MAX_BYTES = 3 * 1024 * 1024; // the form shrinks photos first, so this is generous

// Public list: approved entries only, and never the private contact field.
export async function GET() {
  try {
    const db = admin();
    const { data, error } = await db
      .from("manipur_entries")
      .select("id,name,category,famous_for,description,location,photos,author_name,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;

    const { data: counts } = await db
      .from("manipur_comments")
      .select("entry_id")
      .eq("status", "approved")
      .not("entry_id", "is", null);

    const tally = new Map<string, number>();
    for (const c of (counts ?? []) as { entry_id: string }[]) {
      tally.set(c.entry_id, (tally.get(c.entry_id) ?? 0) + 1);
    }

    const entries = ((data ?? []) as Record<string, unknown>[]).map((e) => ({
      ...e,
      comment_count: tally.get(e.id as string) ?? 0,
    }));
    return NextResponse.json({ entries }, { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ entries: [] }, { status: 200 });
  }
}

// Anyone can submit; it is stored as "pending" until you approve it.
export async function POST(req: Request) {
  if (limited(`entry:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  // Honeypot: real people never see or fill this field.
  if (clean(form.get("website"), 50)) return NextResponse.json({ ok: true });

  const name = clean(form.get("name"), 120);
  const category = clean(form.get("category"), 40);
  const famousFor = clean(form.get("famous_for"), 200);
  const location = clean(form.get("location"), 120);
  const description = cleanText(form.get("description"), 2000);
  const author = clean(form.get("author_name"), 80);
  const contact = clean(form.get("author_contact"), 120);

  if (name.length < 2) return NextResponse.json({ error: "Please add a name." }, { status: 400 });
  if (!author) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Please choose a category." }, { status: 400 });
  }

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `You can add up to ${MAX_PHOTOS} photos.` }, { status: 400 });
  }

  try {
    const db = admin();
    const urls: string[] = [];
    const month = new Date().toISOString().slice(0, 7);

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "Each photo must be under 3 MB." }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const kind = sniffImage(buf);
      if (!kind) {
        return NextResponse.json({ error: "Photos must be JPG, PNG or WebP." }, { status: 400 });
      }
      const path = `${month}/${crypto.randomUUID()}.${kind.ext}`;
      const { error: upErr } = await db.storage
        .from("manipur-photos")
        .upload(path, buf, { contentType: kind.type, upsert: false });
      if (upErr) throw upErr;
      urls.push(db.storage.from("manipur-photos").getPublicUrl(path).data.publicUrl);
    }

    const { error } = await db.from("manipur_entries").insert({
      name,
      category,
      famous_for: famousFor || null,
      location: location || null,
      description: description || null,
      photos: urls,
      author_name: author,
      author_contact: contact || null,
      status: "pending",
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save your entry. Please try again." }, { status: 500 });
  }
}