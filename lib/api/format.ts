// Display helpers for API values: money arrives as strings, times in UTC/offset
// and are shown in IST.

const TZ = "Asia/Kolkata";

export const toNumber = (v?: string | number | null) => {
  const n = typeof v === "number" ? v : parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
};

/** "₹918.20" → "₹918.2" is avoided: whole rupees drop the paise, others keep 2dp. */
export function formatMoney(v?: string | number | null, currency = "INR") {
  const n = toNumber(v);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDateIST(iso?: string | null, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { timeZone: TZ, ...opts });
}

export function formatTimeIST(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
}

/** IST calendar date as YYYY-MM-DD (for sorting alongside the older events). */
export function isoDateIST(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}
