"use client";

import { Fragment, useState } from "react";

type Status = "pending" | "approved" | "rejected";

export type EntryRow = {
  id: string;
  name: string;
  category: string;
  famous_for: string | null;
  description: string | null;
  location: string | null;
  photos: string[] | null;
  author_name: string;
  author_contact: string | null;
  status: Status;
  created_at: string;
};

export type CommentRow = {
  id: string;
  entry_id: string | null;
  author_name: string;
  rating: number | null;
  body: string;
  status: Status;
  created_at: string;
};

type Tab = "entries" | "comments";
type Filter = Status | "all";

const BADGE: Record<Status, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function ApprovalTables({
  initialEntries,
  initialComments,
  entryNames,
}: {
  initialEntries: EntryRow[];
  initialComments: CommentRow[];
  entryNames: Record<string, string>;
}) {
  const [tab, setTab] = useState<Tab>("entries");
  const [filter, setFilter] = useState<Filter>("pending");
  const [entries, setEntries] = useState(initialEntries);
  const [comments, setComments] = useState(initialComments);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingEntries = entries.filter((e) => e.status === "pending").length;
  const pendingComments = comments.filter((c) => c.status === "pending").length;

  async function review(kind: Tab, id: string, status: "approved" | "rejected") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/manipur/${kind}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      if (kind === "entries") {
        setEntries((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
      } else {
        setComments((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(kind: Tab, id: string) {
    const what = kind === "entries" ? "this entry, its photos and its comments" : "this comment";
    if (!window.confirm(`Delete ${what}? This can't be undone.`)) return;

    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/manipur/${kind}/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);

      if (kind === "entries") {
        setEntries((p) => p.filter((r) => r.id !== id));
        // comments on that entry are gone too
        setComments((p) => p.filter((c) => c.entry_id !== id));
        if (openId === id) setOpenId(null);
      } else {
        setComments((p) => p.filter((r) => r.id !== id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  // Plain render function (not a nested component) so buttons don't remount on every state change.
  function renderActions(kind: Tab, id: string, status: Status) {
    const busy = busyId === id;
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {status !== "approved" && (
          <button
            disabled={busy}
            onClick={() => review(kind, id, "approved")}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Approve
          </button>
        )}
        {status !== "rejected" && (
          <button
            disabled={busy}
            onClick={() => review(kind, id, "rejected")}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-amber-300 hover:text-amber-700 disabled:opacity-50"
          >
            Reject
          </button>
        )}
        <button
          disabled={busy}
          onClick={() => remove(kind, id)}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    );
  }

  const entryRows = filter === "all" ? entries : entries.filter((r) => r.status === filter);
  const commentRows = filter === "all" ? comments : comments.filter((r) => r.status === filter);

  const tabBtn = (t: Tab, label: string, pending: number) => (
    <button
      onClick={() => {
        setTab(t);
        setOpenId(null);
      }}
      className={`border-b-2 px-4 py-2 text-sm font-medium ${
        tab === t
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-neutral-500 hover:text-neutral-900"
      }`}
    >
      {label}
      {pending > 0 && (
        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{pending}</span>
      )}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex border-b border-neutral-200">
        {tabBtn("entries", "Entries", pendingEntries)}
        {tabBtn("comments", "Comments", pendingComments)}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize ${
              filter === f
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        {tab === "entries" ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entryRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No {filter === "all" ? "" : filter} entries.
                  </td>
                </tr>
              )}
              {entryRows.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-b border-neutral-100 align-top">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setOpenId(openId === r.id ? null : r.id)}
                        className="text-left font-medium text-neutral-900 hover:text-emerald-700"
                      >
                        {r.name}
                      </button>
                      {r.famous_for && <div className="mt-0.5 text-xs text-neutral-500">{r.famous_for}</div>}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{r.category}</td>
                    <td className="px-4 py-3 text-neutral-700">{r.author_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-500">{fmt(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{renderActions("entries", r.id, r.status)}</td>
                  </tr>
                  {openId === r.id && (
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <td colSpan={6} className="space-y-3 px-4 py-4 text-sm text-neutral-700">
                        {r.location && (
                          <div>
                            <span className="font-medium">Location:</span> {r.location}
                          </div>
                        )}
                        {r.author_contact && (
                          <div>
                            <span className="font-medium">Contact (private):</span> {r.author_contact}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{r.description || "No description."}</p>
                        {r.photos && r.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {r.photos.map((url) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt=""
                                  className="h-24 w-24 rounded-md border border-neutral-200 object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">On</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commentRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No {filter === "all" ? "" : filter} comments.
                  </td>
                </tr>
              )}
              {commentRows.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 align-top">
                  <td className="max-w-md whitespace-pre-wrap px-4 py-3 text-neutral-900">{r.body}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {r.entry_id ? entryNames[r.entry_id] ?? "Unknown entry" : "General review"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{r.author_name}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.rating ? `${r.rating}/5` : "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-500">{fmt(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{renderActions("comments", r.id, r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}