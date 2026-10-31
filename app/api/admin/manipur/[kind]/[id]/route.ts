// app/api/admin/manipur/[kind]/[id]/route.ts  (add alongside PATCH)
import { NextResponse } from "next/server";
import { admin } from "@/lib/manipur/server";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ kind: string; id: string }> }
) {
  // TODO: copy the same admin/auth check your PATCH handler uses here.

  const { kind, id } = await ctx.params;
  const db = admin();

  try {
    if (kind === "comments") {
      const { error } = await db.from("manipur_comments").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (kind === "entries") {
      // 1. Find the photos so we can remove them from storage too.
      const { data: entry, error: getErr } = await db
        .from("manipur_entries")
        .select("photos")
        .eq("id", id)
        .single();
      if (getErr) throw getErr;

      // 2. Remove the entry's comments (harmless if you already have ON DELETE CASCADE).
      const { error: cErr } = await db.from("manipur_comments").delete().eq("entry_id", id);
      if (cErr) throw cErr;

      // 3. Remove the entry itself.
      const { error: eErr } = await db.from("manipur_entries").delete().eq("id", id);
      if (eErr) throw eErr;

      // 4. Best-effort photo cleanup. Public URLs end in /manipur-photos/<month>/<uuid>.<ext>
      const paths = ((entry?.photos ?? []) as string[])
        .map((u) => u.split("/manipur-photos/")[1])
        .filter(Boolean);
      if (paths.length) await db.storage.from("manipur-photos").remove(paths);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown type." }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not delete.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}