// lib/events/curatedEvents.ts
// ---------------------------------------------------------------------------
// Events that have a hand-built landing page under /events/<slug> but no row in
// the `events` table.
//
// The public listing reads `events_full`, so an event that was never entered in
// the admin panel simply does not exist there — no amount of filtering will
// surface it. These entries fill that gap so such events still appear in the
// grid, the hero carousel and the category counts.
//
// This is a stop-gap, not the preferred path. An event entered through
// /admin/events_list gets a real status, date, photo and ticket link that can
// be edited without a deploy. When one of these is added there properly, the
// merge below drops the curated copy automatically (matched on title), so
// nothing appears twice and this file can then be trimmed.
// ---------------------------------------------------------------------------

import type { DBEvent } from "@/app/(main)/events/EventsClient";

export const CURATED_EVENTS: DBEvent[] = [
  {
    // Prefixed so it can never collide with a database UUID.
    id: "curated-abok-ki-singju",
    title: "Abok Ki Singju",
    subtitle: "A student awareness film by NaoTon",
    category: "cultural",
    status: "open",
    tags: ["film", "screening", "students"],
    featured: true,
    accent_color: "#0e7490",
    description:
      "Abok Ki Singju is a student awareness film by NaoTon, presented by Cicada Film Production. " +
      "Premiering 4th October 2026 at M.S.F.D.S, Imphal. Tickets are ₹200, with 50% off for " +
      "students and teachers with a valid ID.",
    organizer_name: "Cicada Film Production",
    date_start: "2026-10-04",
    time_start: "Premiere",
    venue: "M.S.F.D.S",
    city: "Imphal",
    fee_label: "₹200 · 50% off for students & teachers",
    sponsors: [],
    // Both point at the existing landing page, which is where tickets are sold.
    register_href: "/events/abok-ki-singju",
    page_href: "/events/abok-ki-singju",
    image_url: "/abok-ki-singju.jpeg",
    lineup: [],
    schedule: [],
    prizes: [],
  },
];

/** Loose title match, so "Abok Ki Singju 2026" still counts as the same event. */
function normalizeTitle(s: string): string {
  return (s || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Code-side corrections applied on top of matching `events_full` rows (matched
 * on normalized title prefix). Use sparingly — prefer fixing the row in
 * /admin/events_list — but it lets a status like "closed", which the admin
 * panel does not offer, take effect without a DB change.
 */
const EVENT_OVERRIDES: { titlePrefix: string; patch: Partial<DBEvent> }[] = [
  {
    // Event completed on 26 Sept 2026. Details mirror /events/summer-sound.
    titlePrefix: "summer of sound",
    patch: {
      status: "past",
      date_start: "2026-09-26",
      date_end: undefined,
      time_start: "5:00 PM",
      venue: "Chumthang Shannapung, Langthabal",
      organizer_name: "Kok Manga",
      register_href: undefined,
    },
  },
];

function applyOverrides(e: DBEvent): DBEvent {
  const title = normalizeTitle(e.title);
  const o = EVENT_OVERRIDES.find((x) => title.startsWith(x.titlePrefix));
  return o ? { ...e, ...o.patch } : e;
}

/**
 * Merges curated entries into the rows from `events_full`.
 *
 * A curated event is dropped as soon as a database row with the same title
 * exists, so entering it properly in the admin panel silently takes over.
 */
export function mergeCuratedEvents(dbEvents: DBEvent[]): DBEvent[] {
  const existing = new Set(dbEvents.map((e) => normalizeTitle(e.title)));
  const missing = CURATED_EVENTS.filter((e) => !existing.has(normalizeTitle(e.title)));
  return [...dbEvents.map(applyOverrides), ...missing];
}
