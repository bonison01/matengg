// lib/api/types.ts
// Response/request shapes for the centralized Mateng events API, taken from
// its OpenAPI schema. Money arrives as decimal strings ("499.00"); dates are
// ISO-8601 with offset and should be shown in IST.

// ── Auth / customer ─────────────────────────────────────────────────────────

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  user_id: number;
  username: string;
  role: string;
};

export type AddressInput = {
  label?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  is_default?: boolean;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  address?: AddressInput | null;
};

export type RegisterInitResponse = {
  email: string;
  message: string;
  otp_expires_in_seconds: number;
  /** Only populated by non-production backends. */
  otp_debug?: string | null;
};

export type NormalUser = {
  id: number;
  user_id: number;
  user_code: string;
  full_name: string;
  phone: string;
  email: string;
  is_active: boolean;
};

export type NormalUserAddress = AddressInput & {
  id: number;
  normal_user_id: number;
  country: string;
  is_default: boolean;
  is_active: boolean;
};

export type NormalUserDetail = NormalUser & {
  addresses?: NormalUserAddress[];
  default_address?: NormalUserAddress | null;
};

export type RegisterVerifyResponse = {
  user_id: number;
  username: string;
  email_verified: boolean;
  normal_user: NormalUser;
  default_address?: NormalUserAddress | null;
};

export type UsernameSuggestionsResponse = {
  full_name: string;
  /** Main suggestion — free right now, but not reserved. */
  suggested: string;
  alternatives: string[];
};

export type ForgotPasswordResponse = {
  message: string;
  otp_expires_in_seconds: number;
  /** Only populated by non-production backends. */
  otp_debug?: string | null;
};

export type ResetPasswordResponse = { message: string; success?: boolean };

export type CheckEmailResponse = {
  email: string;
  exists: boolean;
  available: boolean;
  message: string;
};

// ── Events ──────────────────────────────────────────────────────────────────

export type ApiEventStatus = "published" | "on_sale" | "paused" | "live" | "tickets_closed" | "completed" | "cancelled" | string;

export type EventCategory = {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  display_name: string;
  description?: string | null;
  icon_url?: string | null;
  color_hex?: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ApiEvent = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category_id: number;
  tags?: string[] | null;
  status: ApiEventStatus;
  visibility: string;
  event_type: string;
  pricing_mode: "paid" | "free" | string;
  starts_at: string;
  ends_at: string;
  doors_open_at?: string | null;
  timezone: string;
  venue_name?: string | null;
  venue_address?: string | null;
  venue_city?: string | null;
  is_online: boolean;
  total_capacity?: number | null;
  tickets_sold: number;
  max_tickets_per_order: number;
  service_fee_mode: string;
  service_fee_value: string;
  currency?: string;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
  branding: Record<string, unknown>;
  settings: Record<string, unknown>;
  published_at?: string | null;
  pause_reason?: string | null;
  created_at: string;
};

export type ApiEventListItem = ApiEvent & {
  poster_url?: string | null;
  pass_count: number;
  coupon_count: number;
};

export type EventListResponse = {
  items: ApiEventListItem[];
  total: number;
  skip: number;
  limit: number;
};

export type EventMedia = {
  id?: number;
  media_type: string;
  /** The guide documents `url`; the live API currently returns `s3_url`. */
  url?: string;
  s3_url?: string;
  is_primary?: boolean;
};

export type TicketAvailability = "available" | "sold_out" | "not_yet_on_sale" | "sale_ended" | "inactive" | string;

export type TicketType = {
  id: number;
  event_id: number;
  code: string;
  name: string;
  description?: string | null;
  price: string;
  compare_at_price?: string | null;
  tier_rank: number;
  is_super: boolean;
  perks?: string[] | null;
  quantity_total?: number | null;
  remaining?: number | null;
  availability: TicketAvailability;
  min_per_order: number;
  max_per_order: number;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  sort_order: number;
};

export type Offer = {
  id: number;
  event_id?: number | null;
  code?: string | null;
  name: string;
  description?: string | null;
  offer_kind: string;
  discount_value?: string | null;
  requires_document: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
};

export type EventDetailResponse = {
  event: ApiEvent;
  media: EventMedia[];
  ticket_types: TicketType[];
  offers: Offer[];
};

// ── Checkout ────────────────────────────────────────────────────────────────

export type CartItem = { ticket_type_id: number; quantity: number };

export type QuoteRequest = {
  items: CartItem[];
  promo_code?: string | null;
  has_documents?: string[] | null;
};

export type QuoteLine = {
  ticket_type_id: number;
  name: string;
  unit_price: string;
  quantity: number;
  line_subtotal: string;
  line_discount: string;
  line_total: string;
};

export type AppliedOffer = {
  offer_id: number;
  name: string;
  kind: string;
  discount_amount: string;
  status?: string;
  requires_document?: boolean;
  note?: string | null;
};

export type QuoteResponse = {
  quote_token: string;
  expires_at: string;
  currency: string;
  items: QuoteLine[];
  applied_offers: AppliedOffer[];
  subtotal: string;
  discount_amount: string;
  service_fee: string;
  tax_amount: string;
  total_amount: string;
};

export type PlaceOrderInput = {
  quote_token: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  student_id?: File | null;
};

export type PaymentStatus = "pending" | "paid" | "success" | "failed" | "expired" | "cancelled" | string;

export type OrderResponse = {
  id: number;
  event_id: number;
  order_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  qty: number;
  subtotal: string;
  discount_amount: string;
  service_fee: string;
  total_amount: string;
  payment_status: PaymentStatus;
  merchant_order_id?: string | null;
  payment_url?: string | null;
  hold_expires_at?: string | null;
  tickets_generated: boolean;
  created_at: string;
};

export type PublicOrder = {
  order_number: string;
  event_id: number;
  first_name: string;
  email_masked: string;
  qty: number;
  total_amount: string;
  currency?: string;
  payment_status: PaymentStatus;
  payment_url?: string | null;
  hold_expires_at?: string | null;
  tickets_generated: boolean;
  created_at: string;
};

export type MyOrder = {
  order_number: string;
  event_id: number;
  event_title?: string | null;
  event_slug?: string | null;
  event_starts_at?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  qty: number;
  total_amount: string;
  currency?: string;
  payment_status: PaymentStatus;
  payment_url?: string | null;
  hold_expires_at?: string | null;
  tickets_generated: boolean;
  created_at: string;
};

export type MyOrderListResponse = { items: MyOrder[]; total: number };

// ── Ticket wallet (on-screen tickets) ───────────────────────────────────────
// GET /public/events/me/orders/{n}/tickets (owner) or /public/events/orders/{n}/tickets.
// Same facts as the ticket PDF; *_text fields are pre-formatted in IST.

export type WalletTicket = {
  ticket_number: number;
  /** The QR payload the gate scanner reads. */
  ticket_code: string;
  tier_name: string;
  is_super: boolean;
  status: "active" | "used" | "revoked" | string;
  is_used: boolean;
  holder_name?: string | null;
  scanned_at?: string | null;
};

export type WalletEvent = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  starts_at: string;
  ends_at: string;
  doors_open_at?: string | null;
  is_online: boolean;
  venue_name?: string | null;
  venue_city?: string | null;
  poster_url?: string | null;
  presenter_line: string;
  date_text: string;
  time_text: string;
  doors_open_text?: string | null;
  venue_line: string;
  venue_address?: string | null;
  contact_numbers: string;
  website: string;
};

export type WalletOrder = {
  order_number: string;
  payment_status: PaymentStatus;
  buyer_name: string;
  /** Masked on the public (order-number) endpoint. */
  email: string;
  phone?: string | null;
  qty: number;
  currency: string;
  subtotal: string;
  discount_amount: string;
  service_fee: string;
  tax_amount: string;
  total_amount: string;
  offer_names: string[];
  payment_id?: string | null;
  payment_method: string;
  booked_text: string;
  paid_text?: string | null;
  items: { name: string; unit_price: string; quantity: number; line_subtotal: string }[];
};

export type TicketWallet = {
  order: WalletOrder;
  event: WalletEvent;
  tickets: WalletTicket[];
  pdf_filename: string;
};
