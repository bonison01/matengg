// lib/events/apiEvents.ts
// ---------------------------------------------------------------------------
// Glue between the centralized events API and this site's existing events UI.
//
// The /events listing was built around Supabase's `events_full` rows (DBEvent).
// Events from the new API are adapted into that shape so both sources render
// side by side in the same grid, carousel and filters. Each adapted event gets
// an `api-` id prefix and points at /events/<slug>, where the booking flow for
// the new API lives.
// ---------------------------------------------------------------------------

import type { CategoryId, DBEvent, EventStatus } from "@/app/(main)/events/EventsClient";
import { eventService } from "@/lib/api/service";
import type { ApiEvent, ApiEventListItem, EventCategory, EventDetailResponse, EventMedia, TicketType } from "@/lib/api/types";
import { formatMoney, formatTimeIST, isoDateIST, toNumber } from "@/lib/api/format";

export const API_EVENT_ID_PREFIX = "api-";
export const isApiEvent = (e: Pick<DBEvent, "id">) => e.id.startsWith(API_EVENT_ID_PREFIX);

// API category slug → the listing's category chips.
const CATEGORY_MAP: Record<string, CategoryId> = {
  music: "concerts",
  movie: "cultural",
  education: "education",
  sports: "sports",
  theatre: "cultural",
  conference: "business",
  workshop: "workshops",
  festival: "cultural",
  community: "cultural",
  other: "cultural",
};

const STATUS_MAP: Record<string, EventStatus> = {
  published: "upcoming",
  on_sale: "open",
  live: "ongoing",
  paused: "paused",
  tickets_closed: "closed",
  completed: "past",
  cancelled: "cancelled",
};

/** Buy-button state per the API's `event.status` rules. */
export function saleState(event: Pick<ApiEvent, "status" | "pricing_mode">): { canBuy: boolean; label: string } {
  switch (event.status) {
    case "on_sale":
    case "live":
      return { canBuy: true, label: "Book tickets" };
    case "published":
      return event.pricing_mode === "free"
        ? { canBuy: true, label: "Reserve free pass" }
        : { canBuy: false, label: "Sales open soon" };
    case "paused":
      return { canBuy: false, label: "Sales paused" };
    case "tickets_closed":
      return { canBuy: false, label: "Tickets closed" };
    case "completed":
      return { canBuy: false, label: "Event ended" };
    case "cancelled":
      return { canBuy: false, label: "Event cancelled" };
    default:
      return { canBuy: false, label: "Not on sale" };
  }
}

export const mediaUrl = (m?: EventMedia | null) => m?.url || m?.s3_url || undefined;

export function posterFrom(media?: EventMedia[], fallback?: string | null) {
  if (fallback) return fallback;
  const list = media || [];
  const poster =
    list.find((m) => m.media_type === "poster" && m.is_primary) ||
    list.find((m) => m.media_type === "poster") ||
    list.find((m) => m.is_primary) ||
    list[0];
  return mediaUrl(poster);
}

export function feeLabel(event: Pick<ApiEvent, "pricing_mode">, passes?: TicketType[]) {
  if (event.pricing_mode === "free") return "Free";
  const prices = (passes || []).map((p) => toNumber(p.price)).filter((n) => n > 0);
  if (!prices.length) return "Tickets on Mateng";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;
}

export function toDBEvent(
  e: ApiEventListItem | ApiEvent,
  opts: { categories?: EventCategory[]; detail?: EventDetailResponse | null } = {},
): DBEvent {
  const cat = opts.categories?.find((c) => c.id === e.category_id);
  const branding = (e.branding || {}) as Record<string, string>;
  const endDate = isoDateIST(e.ends_at);
  const startDate = isoDateIST(e.starts_at);
  const href = `/events/${e.slug}`;
  return {
    id: `${API_EVENT_ID_PREFIX}${e.id}`,
    title: e.title,
    subtitle: e.subtitle || undefined,
    category: (cat && CATEGORY_MAP[cat.slug]) || "cultural",
    status: STATUS_MAP[e.status] || "upcoming",
    tags: e.tags || [],
    featured: e.status === "on_sale" || e.status === "live",
    accent_color: cat?.color_hex || "#3FA637",
    description: e.description || "",
    organizer_name: branding.presenter || "Mateng",
    date_start: startDate,
    date_end: endDate && endDate !== startDate ? endDate : undefined,
    time_start: formatTimeIST(e.starts_at) || undefined,
    venue: e.is_online ? "Online" : e.venue_name || "Venue TBA",
    city: e.venue_city || "",
    fee_label: feeLabel(e, opts.detail?.ticket_types),
    capacity: e.total_capacity ?? undefined,
    sponsors: [],
    register_href: saleState(e).canBuy ? href : undefined,
    page_href: href,
    image_url: posterFrom(opts.detail?.media, (e as ApiEventListItem).poster_url),
    lineup: [],
    schedule: [],
    prizes: [],
  };
}

/**
 * Server-side fetch of every public API event, adapted for the listing.
 * Never throws: if the events API is down the page still renders the older
 * events on their own.
 */
export async function fetchApiEventsForListing(): Promise<DBEvent[]> {
  try {
    const cache = { next: { revalidate: 60 } };
    const [list, categories] = await Promise.all([
      eventService.list({ limit: 100 }, { ...cache, signal: AbortSignal.timeout(4000) }),
      eventService.categories({ ...cache, signal: AbortSignal.timeout(4000) }).catch(() => [] as EventCategory[]),
    ]);
    // The list has no prices and often no poster_url, so pull each detail too.
    const details = await Promise.all(
      list.items.map((e) =>
        eventService.detail(e.slug, { ...cache, signal: AbortSignal.timeout(4000) }).catch(() => null),
      ),
    );
    return list.items.map((e, i) => toDBEvent(e, { categories, detail: details[i] }));
  } catch {
    return [];
  }
}

// ── Checkout state (sessionStorage) ─────────────────────────────────────────
// The cart has to survive the login round-trip, and the order number has to
// survive the Razorpay redirect (which only carries merchantOrderId).

export type StoredCart = {
  slug: string;
  items: { ticket_type_id: number; quantity: number }[];
  promo_code?: string;
  has_student_id?: boolean;
};

const cartKey = (slug: string) => `mateng.eventCart.${slug}`;
const LAST_ORDER_KEY = "lastEventOrder";

function ss(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export const checkoutStore = {
  saveCart: (cart: StoredCart) => ss()?.setItem(cartKey(cart.slug), JSON.stringify(cart)),
  loadCart(slug: string): StoredCart | null {
    try {
      const raw = ss()?.getItem(cartKey(slug));
      return raw ? (JSON.parse(raw) as StoredCart) : null;
    } catch {
      return null;
    }
  },
  clearCart: (slug: string) => ss()?.removeItem(cartKey(slug)),

  saveLastOrder: (orderNumber: string, slug: string) => {
    ss()?.setItem(LAST_ORDER_KEY, orderNumber);
    ss()?.setItem(`${LAST_ORDER_KEY}.slug`, slug);
    // localStorage too: some payment apps return in a fresh tab.
    try {
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ orderNumber, slug }));
    } catch {}
  },
  loadLastOrder(): { orderNumber: string; slug?: string } | null {
    const n = ss()?.getItem(LAST_ORDER_KEY);
    if (n) return { orderNumber: n, slug: ss()?.getItem(`${LAST_ORDER_KEY}.slug`) || undefined };
    try {
      const raw = localStorage.getItem(LAST_ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};
