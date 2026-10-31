import { admin } from "@/lib/manipur/server";
import ApprovalTables, { type EntryRow, type CommentRow } from "./ApprovalTables";

export const dynamic = "force-dynamic";

export default async function ManipurApprovalsPage() {
  const db = admin();

  const [entriesRes, commentsRes] = await Promise.all([
    db
      .from("manipur_entries")
      .select("id,name,category,famous_for,description,location,photos,author_name,author_contact,status,created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    db
      .from("manipur_comments")
      .select("id,entry_id,author_name,rating,body,status,created_at")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const loadError = entriesRes.error?.message || commentsRes.error?.message;

  // Show which entry each comment belongs to.
  const entries = (entriesRes.data ?? []) as EntryRow[];
  const names: Record<string, string> = {};
  for (const e of entries) names[e.id] = e.name;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-lg font-medium text-neutral-900">Manipur Approvals</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Review community entries and comments. Only approved items appear on the public page.
      </p>
      {loadError ? (
        <p className="text-sm text-red-600">Failed to load: {loadError}</p>
      ) : (
        <ApprovalTables
          initialEntries={entries}
          initialComments={(commentsRes.data ?? []) as CommentRow[]}
          entryNames={names}
        />
      )}
    </div>
  );
}