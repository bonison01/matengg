// Upcoming events are hand-written here. Live API events are added after these
// at runtime (_hooks/useUpcomingEvents). Once an event's date has passed, move
// it to PAST_EVENTS below.
export type UpcomingEvent = {
  id: string;
  image: string;
  imageAlt: string;
  /** on_sale / soon are used by events that come from the events API. */
  status: "rescheduled" | "postponed" | "new" | "on_sale" | "soon";
  badgeDate: string;
  title: string;
  description: string;
  modalDescription: string;
  cta:
    | { type: "link"; href: string; label: string }
    | { type: "soon"; label: string };
  /** Hide from the popup shown on page load (e.g. ticket sales closed). */
  hideFromPopup?: boolean;
};

export const STATUS_LABEL: Record<UpcomingEvent["status"], string> = {
  rescheduled: "Rescheduled",
  postponed: "Postponed",
  new: "New",
  on_sale: "Tickets on sale",
  soon: "Coming soon",
};

// No hand-written upcoming events right now.
export const UPCOMING_EVENTS: UpcomingEvent[] = [];

/**
 * Events that must never open in the page-load popup (e.g. postponed ones that
 * still come back from the API). Matched on title, case-insensitive, so it works
 * even though API events have ids we don't control. Remove an entry once the
 * event has a new date and should be promoted again.
 */
const POPUP_HIDDEN_TITLES = ["beats of october"];

/** True when an event should be kept out of the page-load popup. */
export function isHiddenFromPopup(
  event: Pick<UpcomingEvent, "title" | "hideFromPopup">
): boolean {
  if (event.hideFromPopup) return true;
  return POPUP_HIDDEN_TITLES.includes(event.title.trim().toLowerCase());
}

/**
 * Marks a postponed event (see POPUP_HIDDEN_TITLES) as postponed on the page:
 * swaps the badge, copy and button so nobody tries to buy tickets for it.
 * Other events are returned untouched.
 */
export function applyPostponed<T extends UpcomingEvent>(event: T): T {
  if (!POPUP_HIDDEN_TITLES.includes(event.title.trim().toLowerCase())) return event;
  const note =
    "This event has been postponed until further notice. We'll announce the new date soon.";
  return {
    ...event,
    status: "postponed",
    badgeDate: "Until further notice",
    description: note,
    modalDescription: note,
    cta: { type: "soon", label: "Postponed" },
    hideFromPopup: true,
  };
}

const INSTAGRAM ="https://www.instagram.com/matengevents/?hl=en";

export type PastEvent = {
  id: string;
  title: string;
  dateLabel: string;
  description: string;
  cta: { href: string; label: string };
  /** Optional banner image; when present the date sits below the banner. */
  image?: { src: string; alt: string };
};

export const PAST_EVENTS: PastEvent[] = [
  {
    id: "hiyangei-keithel",
    title: "Hiyangei Keithel",
    dateLabel: "NOV · 2025",
    description:
      "A celebration of local trade and tradition, bringing together vendors and visitors from across the state.",
    cta: { href: INSTAGRAM, label: "View Highlights →" },
  },
  {
    id: "career-fair-thoubal",
    title: "Career Fair Thoubal",
    dateLabel: "DEC · 2025",
    description:
      "Connecting Thoubal students with schools, courses, and career guidance under one roof.",
    cta: { href: INSTAGRAM, label: "View Highlights →" },
  },
  {
    id: "manipur-book-fair",
    title: "Manipur Book Fair",
    dateLabel: "FEB · 2026",
    description:
      "10 days of books, readers, and publishers — 7 to 17 February. Thanks to everyone who came by.",
    cta: { href: INSTAGRAM, label: "View Highlights →" },
  },
  {
    id: "g15-festival",
    title: "G15 Festival",
    dateLabel: "24 JUL 2026",
    description:
      "Live music, food & good energy — the festival wrapped up with a great turnout.",
    cta: { href: "/events/g15-festival", label: "View Highlights →" },
    image: { src: "/g15-festival.png", alt: "G15 Festival — past event" },
  },
  {
    id: "mateng-education-festival",
    title: "Mateng Education Festival",
    dateLabel: "EDU · 2026",
    description:
      "Thanks to everyone who joined the Maths, quiz, painting & innovation tracks. Results are available.",
    cta: { href: "/events/matengfest", label: "View Results →" },
  },
  {
    id: "summer-of-sound",
    title: "Summer of Sound Live Concert 2026",
    dateLabel: "26 SEP 2026",
    description:
      "Live music, food & good energy at Chumthang, Shannapung Langthabal — featuring Innocent Eyes, Benita Laishram, Jeet Kshetricha, Makok Band & Eyoom.",
    cta: { href: INSTAGRAM, label: "View Highlights →" },
    image: { src: "/summer.png", alt: "Summer of Sound Live Concert 2026" },
  },
  {
    id: "abok-ki-singju",
    title: "Abok Ki Singju",
    dateLabel: "4 OCT 2026",
    description:
      "A student awareness film by NaoTon, presented by Cicada Film Production, screened at M.S.F.D.S. Thanks to everyone who came.",
    cta: { href: "/events/abok-ki-singju", label: "View Details →" },
    image: { src: "/abok-ki-singju.jpeg", alt: "Abok Ki Singju — past event" },
  },
  {
    id: "beyond-the-street",
    title: "Beyond the Street",
    dateLabel: "4 OCT 2026",
    description:
      "A dancesport battle at Thangmeiband Cheiraoching, Imphal, with Breaking, Hip Hop and All Style categories.",
    cta: { href: "/events/beyond-the-street", label: "View Details →" },
    image: { src: "/beyond-the-street.jpeg", alt: "Beyond the Street — past event" },
  },
];