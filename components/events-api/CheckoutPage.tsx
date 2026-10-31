"use client";
// Checkout for an API event: login gate → buyer details → place order →
// Razorpay (or straight to confirmation for free orders).

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TICKETING_TERMS_PATH } from "@/lib/events/ticketingTerms";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Lock, MapPin, Upload } from "lucide-react";
import { authService, bookingService, eventService } from "@/lib/api/service";
import { ApiError } from "@/lib/api/api";
import { useCustomer } from "@/lib/api/useCustomer";
import { formatDateIST, formatMoney, formatTimeIST, toNumber } from "@/lib/api/format";
import { checkoutStore, posterFrom, type StoredCart } from "@/lib/events/apiEvents";
import type { EventDetailResponse, QuoteResponse } from "@/lib/api/types";
import { Btn, C, Field, Notice, PageSpinner, Shell } from "./ui";

type Form = { first_name: string; last_name: string; email: string; phone: string; address: string };

const keyName = (slug: string, cart: StoredCart) =>
  `mateng.checkoutKey.${slug}.${JSON.stringify(cart.items)}|${cart.promo_code || ""}`;

/** One Idempotency-Key per checkout attempt, reused across retries of the same cart. */
function idempotencyKeyFor(slug: string, cart: StoredCart, fresh = false) {
  const k = keyName(slug, cart);
  try {
    const existing = !fresh && sessionStorage.getItem(k);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(k, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function CheckoutPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { session, ready } = useCustomer();
  const [cart, setCart] = useState<StoredCart | null>(null);
  const [detail, setDetail] = useState<EventDetailResponse | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({ first_name: "", last_name: "", email: "", phone: "", address: "" });
  const [studentId, setStudentId] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const keyRef = useRef<string | null>(null);

  const loginUrl = `/account/login?redirect=${encodeURIComponent(`/events/${slug}/checkout`)}&reason=checkout`;

  // Login gate.
  useEffect(() => {
    if (ready && !session) router.replace(loginUrl);
  }, [ready, session, router, loginUrl]);

  const requote = useCallback(async (c: StoredCart) => {
    const q = await bookingService.quote(slug, {
      items: c.items,
      promo_code: c.promo_code || null,
      has_documents: c.has_student_id ? ["student_id"] : null,
    });
    setQuote(q);
    return q;
  }, [slug]);

  // Load cart, event, fresh quote and profile pre-fill.
  useEffect(() => {
    if (!ready || !session) return;
    const c = checkoutStore.loadCart(slug);
    if (!c || !c.items.length) { router.replace(`/events/${slug}`); return; }
    setCart(c);
    keyRef.current = idempotencyKeyFor(slug, c);
    eventService.detail(slug).then(setDetail).catch(() => {});
    requote(c).catch((err: ApiError) => setLoadError(err.message));
    authService.me().then((me) => {
      const [first, ...rest] = (me.full_name || "").trim().split(" ");
      const addr = me.default_address;
      setForm((f) => ({
        first_name: f.first_name || first || "",
        last_name: f.last_name || rest.join(" "),
        email: f.email || me.email || "",
        phone: f.phone || (me.phone || "").replace(/\D/g, "").slice(-10),
        address: f.address || (addr ? [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ") : ""),
      }));
    }).catch(() => {});
  }, [ready, session?.user_id, slug]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = "Required";
    if (!form.last_name.trim()) e.last_name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "10-digit mobile number";
    if (cart?.has_student_id && !studentId) e.student_id = "Upload your student / teacher ID";
    return e;
  }, [form, cart, studentId]);
  const errOf = (k: string) => fieldErrors[k] || (touched ? errors[k] : undefined);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = k === "phone" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((fe) => ({ ...fe, [k]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setSubmitError(null);
    if (!cart || !quote || Object.keys(errors).length) return;
    setSubmitting(true);

    const place = async (q: QuoteResponse) =>
      bookingService.placeOrder(
        slug,
        {
          quote_token: q.quote_token,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone,
          address: form.address.trim() || undefined,
          student_id: cart.has_student_id ? studentId : null,
        },
        keyRef.current || idempotencyKeyFor(slug, cart),
      );

    try {
      let q = quote;
      if (new Date(q.expires_at).getTime() - Date.now() < 15_000) q = await requote(cart);
      let order;
      try {
        order = await place(q);
      } catch (err) {
        const a = err as ApiError;
        // Stale quote → re-quote once and retry with the same idempotency key.
        if (a.status === 400 && (a.has("expired") || a.has("Quote does not match"))) {
          order = await place(await requote(cart));
        } else if (a.status === 400 && a.has("Idempotency key already used")) {
          keyRef.current = idempotencyKeyFor(slug, cart, true);
          order = await place(q);
        } else {
          throw err;
        }
      }

      // The attempt is over — the next booking of the same passes must get a
      // new key, or the API replays this order instead of creating one.
      try { sessionStorage.removeItem(keyName(slug, cart)); } catch { /* storage blocked */ }
      checkoutStore.saveLastOrder(order.order_number, slug);
      checkoutStore.clearCart(slug);
      if (order.payment_url && order.payment_status === "pending") {
        window.location.href = order.payment_url;
        return; // keep the spinner while the browser leaves
      }
      router.push(`/events/confirmation?order=${encodeURIComponent(order.order_number)}`);
    } catch (err) {
      const a = err as ApiError;
      if (a.isAuth) { router.replace(loginUrl); return; }
      if (a.status === 403 && a.has("customer account")) setSubmitError("Please log in with a customer account to book tickets.");
      else if (a.has("EVENT_TICKETS_CLOSED")) setSubmitError("Ticket sales for this event have closed.");
      else if (a.has("EVENT_SALES_PAUSED")) setSubmitError("Ticket sales for this event are paused right now.");
      else if (a.has("SOLD_OUT")) { setSubmitError("One of your passes just sold out. Go back to pick again."); requote(cart).catch(() => {}); }
      else if (a.has("NOT_ON_SALE")) setSubmitError("These passes aren't on sale right now.");
      else if (a.has("ORDER_LIMIT")) setSubmitError(a.message);
      else if (a.status === 422 && Array.isArray(a.detail)) {
        // Shown under each input; the banner only carries errors with no field.
        const fe = a.fieldErrors();
        const onForm = ["first_name", "last_name", "email", "phone", "address", "student_id"];
        const offForm = Object.keys(fe).filter((k) => !onForm.includes(k)).map((k) => fe[k]);
        setFieldErrors(fe);
        setSubmitError(offForm.length ? offForm.join(" ") : null);
      }
      else setSubmitError(a.message);
      setSubmitting(false);
    }
  };

  if (!ready || !session) return <Shell><PageSpinner label="Checking your account…" /></Shell>;

  const ev = detail?.event;
  const poster = posterFrom(detail?.media);

  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12">
        <Link href={`/events/${slug}`} className="inline-flex items-center gap-1.5 text-sm hover:text-[#F3F1EA] transition" style={{ color: C.muted }}>
          <ArrowLeft className="h-4 w-4" /> Back to event
        </Link>
        <div className="mt-6 mb-10">
          <span className="mx-eyebrow text-[11px]" style={{ color: C.muted }}>Checkout</span>
          <h1 className="mx-display text-3xl sm:text-4xl mt-2">Who&apos;s going?</h1>
        </div>

        {loadError && <div className="mb-6"><Notice>{loadError} <Link href={`/events/${slug}`} className="underline ml-1">Pick passes again</Link></Notice></div>}

        <div className="grid lg:grid-cols-[1fr_400px] gap-10 items-start">
          <form onSubmit={submit} noValidate className="mx-card p-5 sm:p-8 space-y-5 mx-rise">
            {submitError && <Notice>{submitError}</Notice>}

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="First name" htmlFor="co-first" error={errOf("first_name")}>
                <input id="co-first" className="mx-input" autoComplete="given-name" value={form.first_name} onChange={set("first_name")} aria-invalid={!!errOf("first_name")} />
              </Field>
              <Field label="Last name" htmlFor="co-last" error={errOf("last_name")}>
                <input id="co-last" className="mx-input" autoComplete="family-name" value={form.last_name} onChange={set("last_name")} aria-invalid={!!errOf("last_name")} />
              </Field>
            </div>

            <Field label="Email" htmlFor="co-email" error={errOf("email")} hint={<>Tickets are emailed here — <span style={{ color: C.gold }}>double-check it</span>.</>}>
              <input id="co-email" className="mx-input" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={!!errOf("email")} />
            </Field>

            <Field label="Mobile" htmlFor="co-phone" error={errOf("phone")}>
              <input id="co-phone" className="mx-input mx-tabular" type="tel" inputMode="numeric" autoComplete="tel-national" value={form.phone} onChange={set("phone")} aria-invalid={!!errOf("phone")} placeholder="10-digit number" />
            </Field>

            <Field label="Address (optional)" htmlFor="co-address" error={errOf("address")}>
              <textarea id="co-address" className="mx-input" rows={2} autoComplete="street-address" value={form.address} onChange={set("address")} />
            </Field>

            {cart?.has_student_id && (
              <Field label="Student / teacher ID" error={errOf("student_id")} hint="Photo or PDF of a valid ID, for the concession offer.">
                <label className="flex items-center gap-3 rounded-2xl px-4 py-4 cursor-pointer transition hover:bg-white/5"
                  style={{ border: `1px dashed ${errOf("student_id") ? C.red : C.lineStrong}` }}>
                  <Upload className="h-5 w-5" style={{ color: C.green }} />
                  <span className="text-sm truncate" style={{ color: studentId ? C.cream : C.muted }}>{studentId ? studentId.name : "Choose a file"}</span>
                  <input type="file" accept="image/*,application/pdf" className="sr-only"
                    onChange={(e) => { setStudentId(e.target.files?.[0] || null); setFieldErrors((f) => ({ ...f, student_id: "" })); }} />
                </label>
              </Field>
            )}

            <Btn type="submit" block loading={submitting} disabled={!quote} className="!h-14 text-base">
              <Lock className="h-4 w-4" />
              {quote && toNumber(quote.total_amount) === 0 ? "Confirm booking" : quote ? `Pay ${formatMoney(quote.total_amount)}` : "Preparing…"}
            </Btn>
            <p className="text-center text-[12px]" style={{ color: C.muted2 }}>
              Secure payment via Razorpay. Your seats are held for 15 minutes once you continue.
            </p>
            <p className="text-center text-[12px] leading-relaxed" style={{ color: C.muted2 }}>
              By continuing you agree to the{" "}
              <Link href={TICKETING_TERMS_PATH} target="_blank" className="underline underline-offset-4 hover:text-[#3FA637]" style={{ color: C.muted }}>
                Mateng Event Terms &amp; Conditions
              </Link>
              . Mateng is the ticketing partner; the event is run by its organiser.
            </p>
          </form>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 mx-card mx-glow overflow-hidden mx-rise" style={{ animationDelay: "80ms" }}>
            <div className="flex gap-4 p-5" style={{ borderBottom: `1px dashed ${C.lineStrong}` }}>
              <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0" style={{ background: C.surface2 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {poster && <img src={poster} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="mx-display text-lg leading-snug">{ev?.title || " "}</p>
                {ev && (
                  <div className="mt-2 space-y-1 text-[12.5px]" style={{ color: C.muted }}>
                    <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatDateIST(ev.starts_at)} · {formatTimeIST(ev.starts_at)}</p>
                    {(ev.venue_name || ev.venue_city) && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{[ev.venue_name, ev.venue_city].filter(Boolean).join(", ")}</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 space-y-2.5 text-sm">
              {quote ? (
                <>
                  {quote.items.map((l) => (
                    <div key={l.ticket_type_id} className="flex justify-between"><span style={{ color: C.muted }}>{l.name} × {l.quantity}</span><span className="mx-tabular">{formatMoney(l.line_subtotal)}</span></div>
                  ))}
                  {quote.applied_offers.filter((o) => toNumber(o.discount_amount) > 0).map((o) => (
                    <div key={o.offer_id} className="flex justify-between" style={{ color: C.gold }}><span>{o.name}</span><span className="mx-tabular">− {formatMoney(o.discount_amount)}</span></div>
                  ))}
                  {toNumber(quote.service_fee) > 0 && <div className="flex justify-between"><span style={{ color: C.muted }}>Service fee</span><span className="mx-tabular">{formatMoney(quote.service_fee)}</span></div>}
                  {toNumber(quote.tax_amount) > 0 && <div className="flex justify-between"><span style={{ color: C.muted }}>Tax</span><span className="mx-tabular">{formatMoney(quote.tax_amount)}</span></div>}
                  <div className="flex items-baseline justify-between pt-3 mt-1" style={{ borderTop: `1px solid ${C.line}` }}>
                    <span className="font-semibold">Total</span>
                    <span className="mx-tabular text-2xl">{formatMoney(quote.total_amount)}</span>
                  </div>
                  {quote.applied_offers.filter((o) => o.note).map((o) => (
                    <p key={`n${o.offer_id}`} className="text-[12px]" style={{ color: C.muted2 }}>{o.note}</p>
                  ))}
                </>
              ) : (
                <p style={{ color: C.muted }}>{loadError ? "—" : "Calculating…"}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
