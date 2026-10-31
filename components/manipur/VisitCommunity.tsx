"use client";

import { useEffect, useState } from "react";
import Photo from "./Photo";

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
};

// Categories that count as "places to visit / hang out".
// Match these to the names in components/manipur/categories.ts.
// Leave empty ([]) to show every community entry here.
const PLACE_CATEGORIES: string[] = [];

export default function VisitCommunity() {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    fetch("/api/manipur/entries")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((j) => setEntries(j.entries ?? []))
      .catch(() => setEntries([]));
  }, []);

  const spots = (entries ?? []).filter(
    (e) => PLACE_CATEGORIES.length === 0 || PLACE_CATEGORIES.includes(e.category)
  );

  return (
    <div className="mt-14 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label text-maroon">From the community</p>
          <h3 className="font-display text-2xl">Spots added by visitors and locals</h3>
        </div>
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("manipur:add", { detail: {} }))
          }
          className="rounded-full bg-maroon px-5 py-2 text-sm font-medium text-white transition hover:bg-ink"
        >
          + Add a spot
        </button>
      </div>

      {entries === null && <p className="text-sm text-ink/50">Loading…</p>}
      {entries && spots.length === 0 && (
        <p className="rounded-2xl border border-dashed border-ink/20 p-6 text-sm text-ink/60">
          No spots added yet. Know a good one? Add it.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {spots.map((e) => {
          const [hero, ...rest] = e.photos;
          return (
            <article
              key={e.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {hero ? (
                <Photo src={hero} alt={e.name} className="aspect-[4/3] w-full" />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-ink/5 text-sm text-ink/30">
                  No photo yet
                </div>
              )}

              {/* thumbnails: always a 3-column row so edges line up with the hero */}
              {rest.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 px-1.5 pt-1.5">
                  {rest.slice(0, 3).map((p) => (
                    <Photo key={p} src={p} alt={e.name} className="aspect-[4/3] w-full rounded-lg" />
                  ))}
                </div>
              )}

              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="label rounded-full bg-teal/10 px-3 py-1 text-teal">{e.category}</span>
                  {e.location && <span className="text-xs text-ink/50">{e.location}</span>}
                </div>
                <h4 className="font-display text-xl leading-tight">{e.name}</h4>
                {e.famous_for && (
                  <p className="text-sm">
                    <span className="text-ink/50">Famous for: </span>
                    {e.famous_for}
                  </p>
                )}
                {e.description && (
                  <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-ink/75">
                    {e.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-ink/50">
                  <span>Added by {e.author_name}</span>
                  {e.link && (
                    <a
                      href={e.link}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="font-medium text-maroon hover:underline"
                    >
                      Open link &rarr;
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}