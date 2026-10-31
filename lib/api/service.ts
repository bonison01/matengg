// lib/api/service.ts
// ---------------------------------------------------------------------------
// Every call the website makes to the centralized Mateng events API.
// Pages/components import from here — never call `fetch` on the API directly.
//
//   authService    customer (normal_user) register / login / logout / profile
//   eventService   public browsing: categories, list, detail, passes
//   bookingService quote, place order, order status, my bookings, tickets
// ---------------------------------------------------------------------------

import { apiRequest, getSession, setSession, updateSession, ApiError, type RequestOptions } from "./api";
import type {
  CheckEmailResponse,
  EventCategory,
  EventDetailResponse,
  EventListResponse,
  ForgotPasswordResponse,
  MyOrderListResponse,
  NormalUserDetail,
  OrderResponse,
  PlaceOrderInput,
  PublicOrder,
  QuoteRequest,
  QuoteResponse,
  RegisterInitResponse,
  RegisterRequest,
  RegisterVerifyResponse,
  ResetPasswordResponse,
  TicketType,
  TicketWallet,
  TokenResponse,
  UsernameSuggestionsResponse,
} from "./types";

type CacheOpts = Pick<RequestOptions, "next" | "cache" | "signal">;

// ── Customer account ────────────────────────────────────────────────────────

export const authService = {
  checkEmail: (email: string) =>
    apiRequest<CheckEmailResponse>("/auth/check-email", { body: { email } }),

  /** Free usernames built from a full name. Not reserved — register can still 409. */
  usernameSuggestions: (full_name: string, alternatives = 3, signal?: AbortSignal) =>
    apiRequest<UsernameSuggestionsResponse>("/normal-users/username-suggestions", {
      body: { full_name, alternatives },
      signal,
    }),

  /** Step 1 of sign-up: creates a pending account and emails an OTP. */
  register: (data: RegisterRequest) =>
    apiRequest<RegisterInitResponse>("/normal-users/register/self", { body: data }),

  /** Step 2 of sign-up: verifies the emailed OTP and activates the account. */
  verifyOtp: (email: string, otp: string) =>
    apiRequest<RegisterVerifyResponse>("/normal-users/register/self/verify-otp", { body: { email, otp } }),

  resendOtp: (email: string) =>
    apiRequest<RegisterInitResponse>("/normal-users/register/self/resend-otp", { body: { email } }),

  /**
   * Emails a 6-digit reset code. The response is identical whether or not the
   * email has an account, so the UI must not claim the account exists.
   */
  forgotPassword: (email: string) =>
    apiRequest<ForgotPasswordResponse>("/users/forgot-password", { body: { email } }),

  /** Verifies the emailed code and sets the new password. */
  resetPassword: (email: string, otp: string, new_password: string) =>
    apiRequest<ResetPasswordResponse>("/users/reset-password", { body: { email, otp, new_password } }),

  /**
   * Logs in and stores the session. Only `normal_user` accounts can book, so a
   * staff login is rejected here rather than failing later at checkout.
   */
  async login(email: string, password: string) {
    const t = await apiRequest<TokenResponse>("/auth/login", { body: { email, password } });
    if (t.role !== "normal_user") {
      // Don't leave a staff refresh token alive on a customer device.
      apiRequest("/auth/logout", { body: { refresh_token: t.refresh_token } }).catch(() => {});
      throw new ApiError(403, "This is a staff account. Please sign in with a customer account to book tickets.");
    }
    setSession({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      user_id: t.user_id,
      username: t.username,
      role: t.role,
    });
    // Fill the display name; failure here shouldn't fail the login.
    authService.me().catch(() => {});
    return t;
  },

  async logout() {
    const s = getSession();
    setSession(null);
    if (s?.refresh_token) {
      await apiRequest("/auth/logout", { body: { refresh_token: s.refresh_token } }).catch(() => {});
    }
  },

  async me() {
    const me = await apiRequest<NormalUserDetail>("/normal-users/me", { auth: true });
    updateSession({ full_name: me.full_name, email: me.email });
    return me;
  },

  isLoggedIn: () => !!getSession()?.access_token,
};

// ── Browsing ────────────────────────────────────────────────────────────────

export const eventService = {
  categories: (opts?: CacheOpts) =>
    apiRequest<EventCategory[]>("/public/events/categories", opts),

  list: (
    params: { skip?: number; limit?: number; category?: string; city?: string; on_sale_only?: boolean } = {},
    opts?: CacheOpts,
  ) => apiRequest<EventListResponse>("/public/events", { query: params, ...opts }),

  detail: (slug: string, opts?: CacheOpts) =>
    apiRequest<EventDetailResponse>(`/public/events/${encodeURIComponent(slug)}`, opts),

  ticketTypes: (slug: string) =>
    apiRequest<TicketType[]>(`/public/events/${encodeURIComponent(slug)}/ticket-types`, { cache: "no-store" }),
};

// ── Checkout & bookings ─────────────────────────────────────────────────────

export const bookingService = {
  quote: (slug: string, req: QuoteRequest) =>
    apiRequest<QuoteResponse>(`/public/events/${encodeURIComponent(slug)}/quote`, { body: req }),

  /** multipart/form-data + bearer token + Idempotency-Key (one per checkout attempt). */
  placeOrder: (slug: string, input: PlaceOrderInput, idempotencyKey: string) => {
    const form = new FormData();
    form.append("quote_token", input.quote_token);
    form.append("first_name", input.first_name);
    form.append("last_name", input.last_name);
    form.append("email", input.email);
    form.append("phone", input.phone);
    if (input.address) form.append("address", input.address);
    if (input.student_id) form.append("student_id", input.student_id);
    return apiRequest<OrderResponse>(`/public/events/${encodeURIComponent(slug)}/orders`, {
      method: "POST",
      form,
      auth: true,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  orderStatus: (orderNumber: string) =>
    apiRequest<PublicOrder>(`/public/events/orders/${encodeURIComponent(orderNumber)}`, { cache: "no-store" }),

  /** Ask the API to re-check a pending order with Razorpay and record the
   *  payment if it went through (buyer paid but the redirect was lost). */
  syncPayment: (orderNumber: string) =>
    apiRequest<PublicOrder>(`/public/events/orders/${encodeURIComponent(orderNumber)}/payment/sync`, { method: "POST" }),

  myOrders: (skip = 0, limit = 20) =>
    apiRequest<MyOrderListResponse>("/public/events/me/orders", { auth: true, query: { skip, limit } }),

  /** The signed-in buyer's tickets as data (QR payload = ticket_code). */
  myTicketWallet: (orderNumber: string) =>
    apiRequest<TicketWallet>(`/public/events/me/orders/${encodeURIComponent(orderNumber)}/tickets`, { auth: true, cache: "no-store" }),

  /** Tickets by order number (no login; contact details masked). */
  ticketWallet: (orderNumber: string) =>
    apiRequest<TicketWallet>(`/public/events/orders/${encodeURIComponent(orderNumber)}/tickets`, { cache: "no-store" }),

  /** Owner-only ticket PDF. A plain <a href> can't send the token, so fetch + save. */
  async downloadMyTickets(orderNumber: string) {
    const res = await apiRequest<Response>(
      `/public/events/me/orders/${encodeURIComponent(orderNumber)}/tickets.pdf`,
      { auth: true, raw: true },
    );
    saveBlob(await res.blob(), `${orderNumber}.pdf`);
  },

  /** Ticket PDF by order number (no login) — used on the confirmation page. */
  async downloadTickets(orderNumber: string) {
    const res = await apiRequest<Response>(
      `/public/events/orders/${encodeURIComponent(orderNumber)}/tickets.pdf`,
      { raw: true },
    );
    saveBlob(await res.blob(), `${orderNumber}.pdf`);
  },
};

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
