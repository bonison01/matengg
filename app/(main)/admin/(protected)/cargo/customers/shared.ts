// app/(main)/admin/(protected)/cargo/customers/shared.ts
//
// Types and helpers shared between the customer list page and the
// customer detail page (now its own route at customers/[id]).

export interface CargoCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city_state: string;
  pincode: string;
  gstin?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  tracking_id: string;
  product_name: string;
  estimate_charge: number;
  final_charge: number | null;
  payment_status: "paid" | "unpaid" | "partial";
  amount_paid: number;
  status: string;
  created_at: string;
  // Sender/receiver — pulled from the booking record so the customer's
  // ledger can show at-a-glance who each shipment was to/from without
  // navigating into each booking individually.
  sender_name?: string;
  sender_address?: string;
  receiver_name?: string;
  receiver_address?: string;
}

export interface Payment {
  id: string;
  amount: number;
  note: string;
  paid_at: string;
  booking_id: string | null;
}

export interface CustomerWithStats extends CargoCustomer {
  total_billed: number;
  total_paid: number;
  outstanding: number;
  booking_count: number;
}

export const effectiveCharge = (b: Booking) => b.final_charge ?? b.estimate_charge;

// Trims a name/address down to just the first word — used in the bookings
// table Description column so it stays compact and doesn't leak full
// sender/receiver details into a summary view.
export const firstWord = (s?: string) => (s ?? "").trim().split(/\s+/)[0] || "—";

export const PAYMENT_BADGE: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  unpaid: "bg-red-50 text-red-700",
  partial: "bg-amber-50 text-amber-700",
};

// ---------------------------------------------------------------------------
// Cookie-persisted bookings filter — so search/status/date choices survive
// a page reload instead of resetting every time the customer panel opens.
// ---------------------------------------------------------------------------

export const BOOKINGS_FILTER_COOKIE = "cargo_bookings_filter";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&");
  const match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Quick date-range presets for the bookings table filter. "custom" means
// the person is driving the two date inputs directly rather than a preset.
export const DATE_PRESETS = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "last3", label: "Last 3 days" },
  { key: "last7", label: "Last 7 days" },
  { key: "thisWeek", label: "This week" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "custom", label: "Custom range" },
] as const;
export type DatePresetKey = (typeof DATE_PRESETS)[number]["key"];

// Formats a Date as a local yyyy-mm-dd string (avoids the UTC-shift bug
// that toISOString() has near midnight in non-UTC timezones).
export const toLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Computes the {from, to} yyyy-mm-dd pair for a given preset key, anchored
// to "now". Returns nulls for "all" (no filtering) and "custom" (caller
// keeps whatever the person already typed into the date inputs).
export function presetRange(key: DatePresetKey): { from: string; to: string } | null {
  const now = new Date();
  switch (key) {
    case "all":
      return { from: "", to: "" };
    case "today":
      return { from: toLocalYMD(now), to: toLocalYMD(now) };
    case "last3": {
      const from = new Date(now);
      from.setDate(from.getDate() - 2);
      return { from: toLocalYMD(from), to: toLocalYMD(now) };
    }
    case "last7": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: toLocalYMD(from), to: toLocalYMD(now) };
    }
    case "thisWeek": {
      const day = now.getDay(); // 0 = Sunday
      const diffToMonday = day === 0 ? 6 : day - 1;
      const from = new Date(now);
      from.setDate(now.getDate() - diffToMonday);
      return { from: toLocalYMD(from), to: toLocalYMD(now) };
    }
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toLocalYMD(from), to: toLocalYMD(now) };
    }
    case "lastMonth": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toLocalYMD(from), to: toLocalYMD(to) };
    }
    case "custom":
      return null;
  }
}

export interface SavedBookingsFilter {
  search: string;
  filter: "all" | "paid" | "unpaid" | "partial";
  dateFrom: string;
  dateTo: string;
  datePreset: DatePresetKey;
}

export const DEFAULT_BOOKINGS_FILTER: SavedBookingsFilter = {
  search: "",
  filter: "all",
  dateFrom: "",
  dateTo: "",
  datePreset: "all",
};

// Reads the last-used bookings filter from its cookie, falling back to
// defaults for anything missing or malformed (first visit, cleared
// cookies, an older shape from a previous version of this filter, etc).
export function loadSavedBookingsFilter(): SavedBookingsFilter {
  const raw = getCookie(BOOKINGS_FILTER_COOKIE);
  if (!raw) return DEFAULT_BOOKINGS_FILTER;
  try {
    const parsed = JSON.parse(raw);
    return {
      search: typeof parsed.search === "string" ? parsed.search : "",
      filter: (["all", "paid", "unpaid", "partial"] as const).includes(parsed.filter)
        ? parsed.filter
        : "all",
      dateFrom: typeof parsed.dateFrom === "string" ? parsed.dateFrom : "",
      dateTo: typeof parsed.dateTo === "string" ? parsed.dateTo : "",
      datePreset: DATE_PRESETS.some((p) => p.key === parsed.datePreset)
        ? parsed.datePreset
        : "all",
    };
  } catch {
    return DEFAULT_BOOKINGS_FILTER;
  }
}