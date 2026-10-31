"use client";

import { useEffect, useState } from "react";

// These two names must exist in CATEGORIES (components/manipur/categories.ts)
// and match exactly, including capitalisation.
export const TOURIST_CATEGORY = "Tourist spot";
export const HANGOUT_CATEGORY = "Hangout place";

type Spot = { name: string; note: string; area: string; link: string };

const maps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const TOURIST: Spot[] = [
  {
    name: "Loktak Lake",
    area: "Moirang",
    note: "The northeast's largest freshwater lake, dotted with floating phumdis and fishing huts.",
    link: maps("Loktak Lake, Manipur"),
  },
  {
    name: "Keibul Lamjao National Park",
    area: "Bishnupur district",
    note: "The world's only floating national park and the home of the Sangai deer.",
    link: maps("Keibul Lamjao National Park, Manipur"),
  },
  {
    name: "Kangla Fort",
    area: "Imphal",
    note: "The old royal seat on the Imphal river, now an open heritage ground.",
    link: maps("Kangla Fort, Imphal"),
  },
  {
    name: "INA Memorial",
    area: "Moirang",
    note: "Where the Indian National Army first raised the tricolour on Indian soil in 1944.",
    link: maps("INA Memorial Complex, Moirang, Manipur"),
  },
  {
    name: "Sendra Island",
    area: "Loktak Lake",
    note: "A quiet island on Loktak with a viewpoint over the lake, good at sunset.",
    link: maps("Sendra Island, Loktak Lake, Manipur"),
  },
  {
    name: "Shirui Hill",
    area: "Ukhrul",
    note: "Home of the Shirui lily, which flowers around May.",
    link: maps("Shirui Hill, Ukhrul, Manipur"),
  },
  {
    name: "Dzuko Valley",
    area: "Senapati / Nagaland border",
    note: "A high valley of seasonal lilies, reached by trek.",
    link: maps("Dzuko Valley, Manipur"),
  },
];

const HANGOUTS: Spot[] = [
  {
    name: "Paona Bazar",
    area: "Imphal",
    note: "The busy shopping street for clothes, street food and evening walks.",
    link: maps("Paona Bazar, Imphal"),
  },
  {
    name: "Ima Keithel",
    area: "Imphal",
    note: "The Mothers' Market. Come for the stalls, stay for the food.",
    link: maps("Ima Keithel, Imphal"),
  },
  {
    name: "Manipur Zoological Gardens",
    area: "Iroisemba, Imphal",
    note: "A shaded garden zoo, popular with families and for weekend picnics.",
    link: maps("Manipur Zoological Gardens, Imphal"),
  },
  {
    name: "Singda Dam",
    area: "Near Imphal",
    note: "A reservoir with hills around it, a favourite for a half-day outing.",
    link: maps("Singda Dam, Manipur"),
  },
  {
    name: "Mapal Kangjeibung",
    area: "Imphal",
    note: "The historic polo ground in the middle of the city.",
    link: maps("Mapal Kangjeibung, Imphal"),
  },
];

type Entry = {
  id: string;
  name: string;
  category: string;
  famous_for: string | null;
  description: string | null;
  location: string | null;
  photos: string[] | null;
  author_name: string;
  link: string | null;
};

function SpotCard({
  name,
  area,
  note,
  link,
  badge,
}: {
  name: string;
  area?: string | null;
  note?: string | null;
  link?: string | null;
  badge?: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-maroon hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg text-ink">{name}</h3>
        {badge && (
          <span className="shrink-0 rounded-full bg-gold/20 px-2 py-0.5 text-[11px] text-ink/70">{badge}</span>
        )}
      </div>
      {area && <p className="mt-0.5 text-xs text-ink/50">{area}</p>}
      {note && <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/70">{note}</p>}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-4 inline-flex items-center text-sm font-medium text-maroon hover:underline"
        >
          Open link &rarr;
        </a>
      )}
    </div>
  );
}

export default function Visit() {
  const [tab, setTab] = useState<"tourist" | "hangout">("tourist");
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/manipur/entries")
      .then((r) => r.json())
      .then((j) => alive && setEntries(Array.isArray(j.entries) ? j.entries : []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const curated = tab === "tourist" ? TOURIST : HANGOUTS;
  const category = tab === "tourist" ? TOURIST_CATEGORY : HANGOUT_CATEGORY;
  const community = entries.filter((e) => e.category === category);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(
          [
            ["tourist", "Tourist spots"],
            ["hangout", "Hangout places"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              tab === id
                ? "border-maroon bg-maroon text-white"
                : "border-ink/15 bg-white text-ink/70 hover:border-maroon"
            }`}
          >
            {label}
          </button>
        ))}
        <a
          href="#community"
          className="ml-auto rounded-full border border-dashed border-maroon px-4 py-1.5 text-sm text-maroon hover:bg-maroon hover:text-white"
        >
          + Add a {tab === "tourist" ? "tourist spot" : "hangout place"}
        </a>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {curated.map((s) => (
          <SpotCard key={s.name} name={s.name} area={s.area} note={s.note} link={s.link} />
        ))}
        {community.map((e) => (
          <SpotCard
            key={e.id}
            name={e.name}
            area={e.location}
            note={e.description || e.famous_for}
            link={e.link}
            badge={`Added by ${e.author_name}`}
          />
        ))}
      </div>

      {community.length === 0 && (
        <p className="mt-6 text-sm text-ink/50">
          Know a good {tab === "tourist" ? "spot" : "place to hang out"} that isn&rsquo;t listed? Add it and it will
          appear here once approved.
        </p>
      )}
    </div>
  );
}