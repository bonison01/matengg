// components/manipur/Community.tsx
"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Photo from "./Photo";
import { CATEGORIES } from "./categories";

/* ---------- types ---------- */
type Entry = {
  id: string;
  name: string;
  category: string;
  famous_for: string | null;
  description: string | null;
  location: string | null;
  photos: string[];
  author_name: string;
  link: string | null;
  created_at: string;
  comment_count?: number;
};

type Comment = {
  id: string;
  author_name: string;
  rating: number | null;
  body: string;
  created_at: string;
};

type Notice = { ok: boolean; text: string } | null;

const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/15";
const labelCls = "label mb-1.5 block text-ink/60";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* ---------- small pieces ---------- */
function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={value ? `${value} out of 5 stars` : "No rating"}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        const cls = `text-lg leading-none ${on ? "text-gold" : "text-ink/20"}`;
        return onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? 0 : n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`${cls} transition-transform hover:scale-125`}
          >
            ★
          </button>
        ) : (
          <span key={n} className={cls}>★</span>
        );
      })}
    </span>
  );
}

function NoticeBar({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p
      role="status"
      className={`rounded-xl px-4 py-3 text-sm ${
        notice.ok ? "bg-teal/10 text-teal" : "bg-maroon/10 text-maroon"
      }`}
    >
      {notice.text}
    </p>
  );
}

/* Shrinks big phone photos in the browser so uploads stay small and fast. */
async function shrink(file: File, maxSide = 1600): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Photos must be JPG, PNG or WebP.");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.82));
  if (!blob) throw new Error("Could not process that photo.");
  return new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
}

/* ---------- comments / reviews (general page or one entry) ---------- */
export function CommentThread({ entryId }: { entryId?: string }) {
  const [items, setItems] = useState<Comment[] | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/manipur/comments${entryId ? `?entry_id=${entryId}` : ""}`, {
        cache: "no-store",
      });
      setItems(r.ok ? (await r.json()).comments : []);
    } catch {
      setItems([]);
    }
  }, [entryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setNotice(null);
    try {
      const r = await fetch("/api/manipur/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id: entryId ?? null,
          author_name: name,
          body,
          rating: rating || null,
          website,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      setBody("");
      setRating(0);
      setNotice({ ok: true, text: "Thank you! Your comment has been posted." });
      await load();
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSending(false);
    }
  }

  const rated = (items ?? []).filter((c) => c.rating);
  const avg = rated.length ? rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length : 0;

  return (
    <div className="space-y-8">
      {rated.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="font-display text-4xl text-maroon">{avg.toFixed(1)}</span>
          <div>
            <Stars value={Math.round(avg)} />
            <p className="text-xs text-ink/50">{rated.length} rating{rated.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1fr,auto] sm:items-end">
          <div>
            <label className={labelCls} htmlFor={`cn-${entryId ?? "g"}`}>Your name</label>
            <input
              id={`cn-${entryId ?? "g"}`}
              className={inputCls}
              value={name}
              maxLength={80}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <span className={labelCls}>Rating (optional)</span>
            <Stars value={rating} onChange={setRating} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor={`cb-${entryId ?? "g"}`}>Your comment</label>
          <textarea
            id={`cb-${entryId ?? "g"}`}
            className={`${inputCls} min-h-24`}
            value={body}
            maxLength={1000}
            required
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        {/* honeypot: hidden from people, bots fill it in */}
        <input
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          name="website"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={sending}
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white transition hover:bg-maroon disabled:opacity-50"
          >
            {sending ? "Sending…" : "Post comment"}
          </button>
        </div>
        <NoticeBar notice={notice} />
      </form>

      <ul className="space-y-4">
        {items === null && <li className="text-sm text-ink/50">Loading…</li>}
        {items?.length === 0 && <li className="text-sm text-ink/50">No comments yet. Be the first.</li>}
        {items?.map((c) => (
          <li key={c.id} className="rounded-2xl border border-ink/10 p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium">{c.author_name}</span>
              {c.rating ? <Stars value={c.rating} /> : null}
              <span className="text-xs text-ink/40">{fmtDate(c.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/80">{c.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- add-your-own form ---------- */
function EntryForm({ onClose, defaultCategory }: { onClose: () => void; defaultCategory?: string }) {
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [done, setDone] = useState(false);

  const startCategory =
    defaultCategory && (CATEGORIES as readonly string[]).includes(defaultCategory) ? defaultCategory : "";

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setNotice(null);
    try {
      const room = 4 - files.length;
      const picked = Array.from(list).slice(0, room);
      const small = await Promise.all(picked.map((f) => shrink(f)));
      setFiles((prev) => [...prev, ...small.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]);
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : "Could not add that photo." });
    }
  }

  function removeFile(i: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("photos");
    files.forEach((f) => fd.append("photos", f.file));
    setSending(true);
    setNotice(null);
    try {
      const r = await fetch("/api/manipur/entries", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      setDone(true);
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal/5 p-8 text-center">
        <p className="font-display text-2xl text-teal">Thank you!</p>
        <p className="mt-2 text-sm text-ink/70">
          Your entry has been received and will appear on this page once it has been reviewed.
        </p>
        <button onClick={onClose} className="mt-5 rounded-full bg-ink px-5 py-2 text-sm text-white hover:bg-maroon">
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="e-name">Name of the place, person, food, festival…</label>
          <input id="e-name" name="name" required minLength={2} maxLength={120} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="e-cat">Category</label>
          <select id="e-cat" name="category" required defaultValue={startCategory} className={inputCls}>
            <option value="" disabled>Choose one</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="e-fam">Famous for</label>
          <input id="e-fam" name="famous_for" maxLength={200} placeholder="e.g. black rice, floating islands" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="e-loc">Where in Manipur</label>
          <input id="e-loc" name="location" maxLength={120} placeholder="e.g. Ukhrul, Imphal West" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="e-link">Link (optional)</label>
        <input
          id="e-link"
          name="link"
          type="text"
          inputMode="url"
          maxLength={300}
          placeholder="Google Maps or website link"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="e-desc">Tell us more</label>
        <textarea id="e-desc" name="description" maxLength={2000} className={`${inputCls} min-h-32`} />
      </div>

      <div>
        <span className={labelCls}>Photos (up to 4, JPG/PNG/WebP)</span>
        <div className="flex flex-wrap gap-3">
          {files.map((f, i) => (
            <div key={f.preview} className="relative h-24 w-24 overflow-hidden rounded-xl">
              <img src={f.preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 h-6 w-6 rounded-full bg-black/60 text-white"
              >
                ×
              </button>
            </div>
          ))}
          {files.length < 4 && (
            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-ink/25 text-2xl text-ink/40 transition hover:border-maroon hover:text-maroon">
              +
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-ink/50">Only upload photos you took yourself or have permission to share.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="e-auth">Your name</label>
          <input id="e-auth" name="author_name" required maxLength={80} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="e-contact">Email or phone (optional, never shown)</label>
          <input id="e-contact" name="author_contact" maxLength={120} className={inputCls} />
        </div>
      </div>

      {/* honeypot */}
      <input tabIndex={-1} autoComplete="off" aria-hidden name="website" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={sending}
          className="rounded-full bg-maroon px-6 py-2.5 text-sm font-medium text-white transition hover:bg-ink disabled:opacity-50"
        >
          {sending ? "Submitting…" : "Submit for review"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-sm text-ink/60 hover:text-ink">
          Cancel
        </button>
      </div>
      <NoticeBar notice={notice} />
    </form>
  );
}

/* ---------- approved entries + the add form ---------- */
export function CommunityEntries() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState<string | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/manipur/entries")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((j) => setEntries(j.entries ?? []))
      .catch(() => setEntries([]));
  }, []);

  // The Visit section dispatches this to open the form with a category chosen.
  useEffect(() => {
    function onAdd(ev: Event) {
      const category = (ev as CustomEvent<{ category?: string }>).detail?.category;
      setFormCategory(category);
      setFormKey((k) => k + 1);
      setShowForm(true);
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
    window.addEventListener("manipur:add", onAdd);
    return () => window.removeEventListener("manipur:add", onAdd);
  }, []);

  const cats = ["All", ...Array.from(new Set((entries ?? []).map((e) => e.category)))];
  const shown = (entries ?? []).filter((e) => filter === "All" || e.category === filter);

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-prose text-ink/70">
          Know a place, hangout spot, dish, festival, person or craft that makes Manipur special? Add it
          with photos and we&rsquo;ll feature it here after a quick review.
        </p>
        {!showForm && (
          <button
            onClick={() => {
              setFormCategory(undefined);
              setFormKey((k) => k + 1);
              setShowForm(true);
            }}
            className="rounded-full bg-maroon px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-ink"
          >
            + Add to Manipur
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <EntryForm key={formKey} defaultCategory={formCategory} onClose={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {cats.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                filter === c ? "border-maroon bg-maroon text-white" : "border-ink/15 text-ink/70 hover:border-maroon"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {entries === null && <p className="text-sm text-ink/50">Loading…</p>}
      {entries?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-ink/20 p-8 text-sm text-ink/60">
          Nothing here yet. Be the first to add something about Manipur.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {shown.map((e) => {
          const isOpen = open === e.id;
          return (
            <article key={e.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
              {e.photos[0] && (
                <Photo src={e.photos[0]} alt={e.name} className="aspect-[16/10] w-full" />
              )}
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="label rounded-full bg-teal/10 px-3 py-1 text-teal">{e.category}</span>
                  {e.location && <span className="text-xs text-ink/50">{e.location}</span>}
                </div>
                <h3 className="font-display text-2xl leading-tight">{e.name}</h3>
                {e.famous_for && (
                  <p className="text-sm">
                    <span className="text-ink/50">Famous for: </span>
                    {e.famous_for}
                  </p>
                )}
                {e.description && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink/75">{e.description}</p>
                )}
                {e.link && (
                  <a
                    href={e.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex text-sm font-medium text-maroon hover:underline"
                  >
                    Open link &rarr;
                  </a>
                )}
                {e.photos.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {e.photos.slice(1).map((p) => (
                      <Photo key={p} src={p} alt={e.name} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 text-xs text-ink/50">
                  <span>Added by {e.author_name} · {fmtDate(e.created_at)}</span>
                  <button
                    onClick={() => setOpen(isOpen ? null : e.id)}
                    className="rounded-full border border-ink/15 px-3 py-1 text-ink/70 transition hover:border-maroon hover:text-maroon"
                  >
                    {isOpen ? "Hide" : `Comments${e.comment_count ? ` (${e.comment_count})` : ""}`}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <CommentThread entryId={e.id} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}