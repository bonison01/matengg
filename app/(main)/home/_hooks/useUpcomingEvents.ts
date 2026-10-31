import { useEffect, useState } from "react";
import { eventService } from "@/lib/api/service";
import { formatDateIST, formatTimeIST } from "@/lib/api/format";
import type { ApiEventListItem, EventDetailResponse } from "@/lib/api/types";
import { feeLabel, posterFrom, saleState } from "@/lib/events/apiEvents";
import { UPCOMING_EVENTS, type UpcomingEvent } from "../_data/events";

/** API events worth promoting: public and still ahead, soonest first. */
const PROMOTE = new Set(["published", "on_sale", "live"]);
const MAX_API_EVENTS = 4;
/** Don't hold the popup / section back longer than this waiting for the API. */
const WAIT_MS = 2500;

function toPopupEvent(e: ApiEventListItem, detail: EventDetailResponse | null): UpcomingEvent {
  const sale = saleState(e);
  const when = `${formatDateIST(e.starts_at, { day: "numeric", month: "long", year: "numeric" })} · ${formatTimeIST(e.starts_at)}`;
  const venue = e.is_online ? "Online" : [e.venue_name, e.venue_city].filter(Boolean).join(", ");
  const about = (e.subtitle || e.description || "").trim();
  const fee = feeLabel(e, detail?.ticket_types);
  const blurb = about.length > 240 ? `${about.slice(0, 237).trimEnd()}…` : about;
  return {
    id: `api-${e.id}`,
    image: posterFrom(detail?.media, e.poster_url) || "",
    imageAlt: e.title,
    status: sale.canBuy ? "on_sale" : "soon",
    badgeDate: when,
    title: e.title,
    description: [blurb, fee !== "Tickets on Mateng" && `Tickets ${fee}.`].filter(Boolean).join(" ") || `${when}${venue ? ` · ${venue}` : ""}`,
    modalDescription: [blurb, venue && `${when} at ${venue}.`, fee !== "Tickets on Mateng" && `Tickets ${fee}.`]
      .filter(Boolean)
      .join(" "),
    cta: sale.canBuy
      ? { type: "link", href: `/events/${e.slug}`, label: "Book Tickets →" }
      : { type: "soon", label: sale.label },
  };
}

async function loadApiPopupEvents(signal: AbortSignal): Promise<UpcomingEvent[]> {
  const list = await eventService.list({ limit: 50 }, { signal });
  const now = Date.now();
  const upcoming = list.items
    .filter((e) => e.visibility === "public" && PROMOTE.has(e.status) && new Date(e.ends_at).getTime() > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, MAX_API_EVENTS);
  // The list has no prices and often no poster_url — the detail has both.
  const details = await Promise.all(upcoming.map((e) => eventService.detail(e.slug, { signal }).catch(() => null)));
  return upcoming.map((e, i) => toPopupEvent(e, details[i]));
}

/**
 * Upcoming events for the homepage section and the entry popup: the
 * hand-written ones (Abok Ki Singju) first, then live events from the API.
 * `ready` flips once the API answers or WAIT_MS passes, so the popup opens
 * once, already complete. `popup` drops entries marked hideFromPopup.
 */
export function useUpcomingEvents() {
  const [events, setEvents] = useState<UpcomingEvent[]>(UPCOMING_EVENTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const giveUp = setTimeout(() => setReady(true), WAIT_MS);
    loadApiPopupEvents(ctrl.signal)
      .then((api) => {
        const manual = new Set(UPCOMING_EVENTS.map((e) => e.title.toLowerCase()));
        setEvents([...UPCOMING_EVENTS, ...api.filter((e) => !manual.has(e.title.toLowerCase()))]);
      })
      .catch(() => { /* API down: the hand-written events alone */ })
      .finally(() => { clearTimeout(giveUp); setReady(true); });
    return () => { ctrl.abort(); clearTimeout(giveUp); };
  }, []);

  return { events, popup: events.filter((e) => !e.hideFromPopup), ready };
}
