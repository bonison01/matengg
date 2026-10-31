// lib/api/api.ts
// ---------------------------------------------------------------------------
// Base client for the centralized Mateng events + customer-account API.
//
// This backend is a separate service from anything else this Next.js app
// talks to (Supabase, Prisma, api.matengdelivery.com). Everything that calls
// it goes through `apiRequest` below so the base URL, auth header, error shape
// and token refresh live in exactly one place.
//
// Configure with NEXT_PUBLIC_MATENG_API_URL (no trailing slash), e.g.
//   NEXT_PUBLIC_MATENG_API_URL=http://127.0.0.1:8000
// ---------------------------------------------------------------------------

import type { TokenResponse } from "./types";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_MATENG_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

// ── Errors ──────────────────────────────────────────────────────────────────

/** Error bodies from the API are `{ detail: string }` or a FastAPI validation list. */
export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(ApiError.messageFrom(status, detail));
    this.status = status;
    this.detail = detail;
  }

  /**
   * Missing/expired credentials. The API answers 401 for a bad token but 403
   * "Not authenticated" when no token was sent at all.
   */
  get isAuth(): boolean {
    return this.status === 401 || (this.status === 403 && this.has("Not authenticated"));
  }

  /** True when the `detail` string contains `code` (e.g. "SOLD_OUT"). */
  has(code: string): boolean {
    return typeof this.detail === "string" && this.detail.toUpperCase().includes(code.toUpperCase());
  }

  /**
   * Field errors from a 422 validation list, keyed by field name (the last
   * `loc` segment), with the backend's technical wording turned into short,
   * plain messages that can sit under the input.
   */
  fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.detail)) return {};
    const out: Record<string, string> = {};
    for (const d of this.detail as ValidationItem[]) {
      const key = String(d.loc?.[d.loc.length - 1] ?? "");
      if (key && !out[key]) out[key] = friendlyFieldMessage(key, d);
    }
    return out;
  }

  static messageFrom(status: number, detail: unknown): string {
    if (typeof detail === "string" && detail) {
      const code = Object.keys(CODE_MESSAGES).find((c) => detail.toUpperCase().includes(c));
      return code ? CODE_MESSAGES[code] : detail;
    }
    if (Array.isArray(detail) && detail.length) {
      const first = detail[0] as { msg?: string; loc?: unknown[] };
      const field = first.loc?.[first.loc.length - 1];
      return `${field ? `${String(field)}: ` : ""}${(first.msg || "Invalid input").replace(/^Value error,\s*/i, "")}`;
    }
    if (status === 0) return "Can't reach the server. Check your connection and try again.";
    if (status >= 500) return "Something went wrong on our side. Please try again.";
    return "Request failed";
  }
}

/**
 * Readable text for the API's machine error codes. `ApiError.detail` keeps the
 * raw code, so `err.has("SOLD_OUT")` checks still work.
 */
const CODE_MESSAGES: Record<string, string> = {
  EVENT_SALES_PAUSED: "Ticket sales for this event are paused right now.",
  EVENT_TICKETS_CLOSED: "Ticket sales for this event have closed.",
  TICKET_TYPE_SOLD_OUT: "One of your tickets just sold out. Please choose again.",
  SOLD_OUT: "One of your tickets just sold out. Please choose again.",
  TICKET_TYPE_NOT_ON_SALE: "That ticket isn't on sale right now.",
  NOT_ON_SALE: "Tickets aren't on sale right now.",
  ORDER_LIMIT_EXCEEDED: "That's more tickets than one order allows.",
  ORDER_LIMIT: "That's more tickets than one order allows.",
  OFFER_INVALID: "That promo code isn't valid for this event.",
  PRICING_MODE_MISMATCH: "These tickets can't be booked right now. Please try again later.",
};

type ValidationItem = { type?: string; loc?: unknown[]; msg?: string; ctx?: Record<string, unknown> };

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full name",
  first_name: "First name",
  last_name: "Last name",
  username: "Username",
  email: "Email",
  phone: "Mobile number",
  password: "Password",
  new_password: "New password",
  otp: "Code",
  address: "Address",
};

/** Plain-language message for one FastAPI/Pydantic validation item. */
function friendlyFieldMessage(key: string, d: ValidationItem): string {
  const label = FIELD_LABELS[key] || "This field";
  const type = d.type || "";
  const msg = (d.msg || "").replace(/^Value error,\s*/i, "");
  const min = d.ctx?.min_length;
  const max = d.ctx?.max_length;

  if (type === "missing") return `${label} is required`;
  if (key === "phone") return "Enter a valid 10-digit mobile number";
  if (key === "email") {
    const reason = String(d.ctx?.reason || msg);
    if (/special-use|reserved|does not exist|not accept/i.test(reason)) return "This email domain can't be used — enter your real email address";
    return "Enter a valid email address";
  }
  if (type === "string_too_short") return min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`;
  if (type === "string_too_long") return `${label} must be at most ${max} characters`;
  if (type === "string_pattern_mismatch" && key === "username") return "Use only letters, numbers, _ or .";
  // Custom validator messages are usually already readable; just tidy them.
  return msg ? msg.charAt(0).toUpperCase() + msg.slice(1) : `${label} is invalid`;
}

// ── Session (tokens) ────────────────────────────────────────────────────────
// Stored in localStorage under its own key so it never collides with the
// older site login (which uses the redux `user` slice + other keys).

const SESSION_KEY = "mateng.customer.session";
const SESSION_EVENT = "mateng:customer-session";

export type CustomerSession = Pick<TokenResponse, "access_token" | "refresh_token" | "user_id" | "username" | "role"> & {
  /** Display name, filled from /normal-users/me after login. */
  full_name?: string;
  email?: string;
};

export function getSession(): CustomerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CustomerSession) : null;
  } catch {
    return null;
  }
}

export function setSession(next: CustomerSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (next) window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage blocked — session lives for this page only */
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function updateSession(patch: Partial<CustomerSession>) {
  const cur = getSession();
  if (cur) setSession({ ...cur, ...patch });
}

/** Subscribe to session changes in this tab and others. Returns an unsubscribe fn. */
export function onSessionChange(cb: () => void): () => void {
  const storage = (e: StorageEvent) => { if (e.key === SESSION_KEY) cb(); };
  window.addEventListener(SESSION_EVENT, cb);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(SESSION_EVENT, cb);
    window.removeEventListener("storage", storage);
  };
}

// ── Token refresh (single-flight) ───────────────────────────────────────────
// Refresh tokens rotate, so two concurrent 401s must share one refresh call —
// otherwise the second spends an already-revoked token and logs the user out.

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const session = getSession();
  if (!session?.refresh_token) return false;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      if (!res.ok) {
        setSession(null);
        return false;
      }
      const t = (await res.json()) as TokenResponse;
      updateSession({ access_token: t.access_token, refresh_token: t.refresh_token });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function isAuthFailure(res: Response) {
  if (res.status === 401) return true;
  if (res.status !== 403) return false;
  try {
    const body = (await res.clone().json()) as { detail?: unknown };
    return typeof body.detail === "string" && /not authenticated/i.test(body.detail);
  } catch {
    return false;
  }
}

// ── Request ─────────────────────────────────────────────────────────────────

type Query = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body (ignored when `form` is set). */
  body?: unknown;
  /** multipart/form-data body. The browser sets the boundary header itself. */
  form?: FormData;
  query?: Query;
  headers?: Record<string, string>;
  /** Send the customer's bearer token (and refresh once on 401). */
  auth?: boolean;
  /** Return the raw Response (for blobs like tickets.pdf). */
  raw?: boolean;
  signal?: AbortSignal;
  /** Next.js fetch cache options when called from a server component. */
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
};

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const doFetch = async () => {
    const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
    let body: BodyInit | undefined;
    if (opts.form) body = opts.form;
    else if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
    if (opts.auth) {
      const token = getSession()?.access_token;
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return fetch(buildUrl(path, opts.query), {
      method: opts.method || (body ? "POST" : "GET"),
      headers,
      body,
      signal: opts.signal,
      ...(opts.next ? { next: opts.next } : {}),
      ...(opts.cache ? { cache: opts.cache } : {}),
    });
  };

  let res: Response;
  try {
    res = await doFetch();
    if (opts.auth && getSession() && (await isAuthFailure(res)) && (await refreshTokens())) {
      res = await doFetch();
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(0, null);
  }

  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = ((await res.json()) as { detail?: unknown })?.detail ?? null;
    } catch {
      /* non-JSON error body */
    }
    const err = new ApiError(res.status, detail);
    if (opts.auth && err.isAuth) setSession(null);
    throw err;
  }

  if (opts.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
