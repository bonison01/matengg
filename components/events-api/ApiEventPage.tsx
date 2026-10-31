"use client";
// Event page for events from the centralized events API: details, pass picker,
// promo code and a live server quote. "Continue" saves the cart to
// sessionStorage and goes to checkout (via login when signed out).
//
// Layout mirrors the hand-built /events/abok-ki-singju page: full-bleed poster
// hero, info cards, "Know before you go" details, then a centered ticket card
// (passes on the left, order summary on the right).

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BookingHelpCta from "@/components/events-api/BookingHelpCta";
import { TICKETING_TERMS_PATH } from "@/lib/events/ticketingTerms";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarCheck, CalendarDays, Clock, DoorOpen, GraduationCap, Loader2, Lock, PauseCircle, XCircle, MapPin, Minus, Phone, Plus, Sparkles, Tag, Ticket, Tickets, UserRound, X } from "lucide-react";
import { bookingService, eventService } from "@/lib/api/service";
import { ApiError } from "@/lib/api/api";
import { useCustomer } from "@/lib/api/useCustomer";
import { formatDateIST, formatMoney, formatTimeIST, toNumber } from "@/lib/api/format";
import { checkoutStore, posterFrom, saleState } from "@/lib/events/apiEvents";
import type { EventDetailResponse, QuoteResponse, TicketType } from "@/lib/api/types";
import { C, Notice, Shell } from "./ui";

const AVAIL_LABEL: Record<string, string> = {
  sold_out: "Sold out",
  not_yet_on_sale: "Not on sale yet",
  sale_ended: "Sales ended",
  inactive: "Unavailable",
};

export default function ApiEventPage({ data, categoryName }: { data: EventDetailResponse; categoryName?: string }) {
  const router = useRouter();
  const { session } = useCustomer();
  const { event, offers } = data;
  const [passes, setPasses] = useState<TicketType[]>(data.ticket_types);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [hasStudentId, setHasStudentId] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ticketsRef = useRef<HTMLDivElement>(null);

  const sale = saleState(event);
  const poster = posterFrom(data.media);
  const docOffers = offers.filter((o) => o.is_active && o.requires_document);
  const autoOffers = offers.filter((o) => o.is_active && !o.code && !o.requires_document);
  const hasCodeOffers = offers.some((o) => o.is_active && o.code);

  // Restore a cart saved earlier in this tab (e.g. back from login).
  useEffect(() => {
    if (!sale.canBuy) return;
    const saved = checkoutStore.loadCart(event.slug);
    if (!saved) return;
    setCart(Object.fromEntries(saved.items.map((i) => [i.ticket_type_id, i.quantity])));
    if (saved.promo_code) { setPromo(saved.promo_code); setPromoInput(saved.promo_code); }
    setHasStudentId(!!saved.has_student_id);
  }, [event.slug, sale.canBuy]);

  const items = useMemo(
    () => Object.entries(cart).filter(([, q]) => q > 0).map(([id, q]) => ({ ticket_type_id: Number(id), quantity: q })),
    [cart],
  );
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  const refreshPasses = useCallback(async () => {
    try { setPasses(await eventService.ticketTypes(event.slug)); } catch {}
  }, [event.slug]);

  // Server quote — never price on the client. Debounced on every cart change.
  useEffect(() => {
    // No quotes while sales are paused / closed / not yet open.
    if (!items.length || !sale.canBuy) { setQuote(null); setError(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setQuoting(true);
      try {
        const q = await bookingService.quote(event.slug, {
          items,
          promo_code: promo || null,
          has_documents: hasStudentId ? ["student_id"] : null,
        });
        if (!cancelled) { setQuote(q); setError(null); }
      } catch (err) {
        if (cancelled) return;
        const a = err as ApiError;
        if (a.has?.("OFFER_INVALID") && promo) {
          setPromoError("That code isn't valid for this event.");
          setPromo("");
          return;
        }
        // Status changed since the page loaded — reload it into the right state.
        if (a.has?.("EVENT_TICKETS_CLOSED") || a.has?.("EVENT_SALES_PAUSED") || a.has?.("NOT_ON_SALE")) {
          setCart({});
          router.refresh();
        }
        if (a.has?.("SOLD_OUT")) refreshPasses();
        setQuote(null);
        setError(a.message);
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [items, promo, hasStudentId, event.slug, refreshPasses, sale.canBuy, router]);

  const step = (p: TicketType, dir: 1 | -1) => {
    setCart((c) => {
      const cur = c[p.id] || 0;
      const othersQty = totalQty - cur;
      const maxByEvent = event.max_tickets_per_order - othersQty;
      const max = Math.min(p.max_per_order || 10, p.remaining ?? Infinity, maxByEvent);
      let next = cur + dir;
      if (dir === 1 && cur === 0) next = Math.max(1, p.min_per_order || 1);
      if (dir === -1 && next < (p.min_per_order || 1)) next = 0;
      next = Math.max(0, Math.min(next, max));
      return { ...c, [p.id]: next };
    });
  };

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    setPromo(promoInput.trim().toUpperCase());
  };

  const proceed = () => {
    if (!quote || !items.length) return;
    checkoutStore.saveCart({ slug: event.slug, items, promo_code: promo || undefined, has_student_id: hasStudentId });
    const dest = `/events/${event.slug}/checkout`;
    if (session) router.push(dest);
    else router.push(`/account/login?redirect=${encodeURIComponent(dest)}&reason=checkout`);
  };

  const dateLabel = formatDateIST(event.starts_at, { day: "numeric", month: "long", year: "numeric" });
  const timeLabel = `${formatTimeIST(event.starts_at)}${event.ends_at ? ` – ${formatTimeIST(event.ends_at)}` : ""}`;
  const where = event.is_online ? "Online" : [event.venue_name, event.venue_city].filter(Boolean).join(", ");
  const branding = (event.branding || {}) as Record<string, string>;
  const presenter = branding.presenter?.trim();
  const director = branding.director?.trim();
  const contact = (branding.contact_numbers || "").split(/[,/]/).map((s) => s.trim()).filter(Boolean)[0];
  const contactTel = contact ? contact.replace(/[^\d+]/g, "") : "";
  const prices = passes.map((p) => toNumber(p.price));
  const fromPrice = event.pricing_mode === "free" ? "Free" : prices.length ? `From ${formatMoney(Math.min(...prices))}` : "Tickets soon";
  const docOffer = docOffers[0];
  const salesState = sale.canBuy ? null : salesStateCopy(event.status, event.title, event.pause_reason);

  // "Claude Test Night" → "Claude Test" + italic green "Night", like the Abok hero.
  const words = event.title.trim().split(/\s+/);
  const titleHead = words.length > 1 ? words.slice(0, -1).join(" ") : "";
  const titleTail = words[words.length - 1];

  const infoCards = [
    { icon: <Ticket className="h-5 w-5" />, label: "Category", value: categoryName || "Event" },
    { icon: <UserRound className="h-5 w-5" />, label: director ? "Director" : "Presented by", value: director || presenter || "Mateng" },
    { icon: <Tickets className="h-5 w-5" />, label: "Tickets", value: fromPrice },
    docOffer
      ? { icon: <GraduationCap className="h-5 w-5" />, label: "Student & teacher", value: docOffer.name }
      : autoOffers[0]
        ? { icon: <Sparkles className="h-5 w-5" />, label: "Offer", value: autoOffers[0].name }
        : { icon: <CalendarDays className="h-5 w-5" />, label: "Date", value: dateLabel },
  ];

  const detailCards = [
    { icon: <CalendarDays className="h-5 w-5" />, label: "Date", value: formatDateIST(event.starts_at, { weekday: "short", day: "numeric", month: "long", year: "numeric" }) },
    { icon: <Clock className="h-5 w-5" />, label: "Time", value: `${timeLabel} IST` },
    { icon: <MapPin className="h-5 w-5" />, label: "Venue", value: where || "To be announced" },
    { icon: <Tickets className="h-5 w-5" />, label: "Ticket", value: fromPrice },
  ];

  return (
    <Shell>
      {/* ---------------- FULL-BLEED HERO PHOTO ---------------- */}
      <section className="relative w-full h-[92vh] sm:h-[86vh] min-h-[560px] sm:min-h-[620px] max-h-[900px] overflow-hidden">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={`${event.title} poster`} fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-[50%_20%]" />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 20%, rgba(63,166,55,0.28), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(232,184,75,0.16), transparent 60%), ${C.surface}` }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,20,16,0.15) 0%, rgba(11,20,16,0.25) 40%, rgba(11,20,16,0.88) 82%, #0B1410 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(11,20,16,0.55) 0%, rgba(11,20,16,0) 45%, rgba(11,20,16,0) 100%)" }} />

        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-14 sm:pb-16">
          <div className="mx-rise">
            <nav aria-label="Breadcrumb" className="mb-5 text-[12px]" style={{ color: "#B8C4BA" }}>
              <Link href="/events" className="hover:text-[#F3F1EA]">Events</Link>
              <span className="mx-2 opacity-50">/</span>
              <span>{event.title}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {presenter && <span className="mx-eyebrow text-[11px]" style={{ color: C.gold }}>{presenter}</span>}
              {!sale.canBuy && (
                <span className="mx-eyebrow text-[10px] px-2.5 py-0.5 rounded-full" style={{ background: "rgba(232,184,75,0.14)", color: C.gold }}>{sale.label}</span>
              )}
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl leading-[1.02] max-w-3xl" style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: C.cream }}>
              {titleHead && <>{titleHead}{" "}</>}
              <em style={{ fontStyle: "italic", color: C.green }}>{titleTail}</em>
            </h1>

            {(event.subtitle || categoryName) && (
              <p className="mx-eyebrow mt-3 text-[11px] sm:text-xs" style={{ color: "#B8C4BA" }}>
                {[event.subtitle, categoryName].filter(Boolean).join("  ·  ")}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2.5 mt-7">
              <HeroChip icon={<CalendarDays className="h-3.5 w-3.5" />}>{dateLabel}</HeroChip>
              <HeroChip icon={<Clock className="h-3.5 w-3.5" />}>{formatTimeIST(event.starts_at)}</HeroChip>
              {where && <HeroChip icon={<MapPin className="h-3.5 w-3.5" />}>{where}</HeroChip>}
              {contact && (
                <a href={`tel:${contactTel}`} className="hover:brightness-125 transition">
                  <HeroChip icon={<Phone className="h-3.5 w-3.5" />}>{contact}</HeroChip>
                </a>
              )}
            </div>

            <button type="button" onClick={() => ticketsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              disabled={!sale.canBuy}
              className="mt-9 px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              style={{ background: sale.canBuy ? C.green : "rgba(243,241,234,0.1)", color: sale.canBuy ? C.bg : C.muted }}>
              {sale.canBuy && <span className="mx-live inline-block w-1.5 h-1.5 rounded-full" style={{ background: C.bg }} />}
              {sale.canBuy ? "Get Your Ticket" : sale.label}
              {sale.canBuy && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* ---------------- ABOUT THE EVENT ---------------- */}
      <section className="px-6 pt-16 sm:pt-20 flex flex-col items-center">
        <span className="mx-eyebrow text-[11px] mb-3" style={{ color: "#8FA391" }}>The Event</span>
        <h2 className="text-2xl sm:text-3xl mb-6 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
          {event.subtitle || "About this event"}
        </h2>
        {event.description && (
          <p className="max-w-3xl text-center text-[15px] sm:text-base leading-[1.8] whitespace-pre-line mb-10" style={{ color: C.muted }}>
            {event.description}
          </p>
        )}
        <CardGrid items={infoCards} className={event.description ? "" : "mt-4"} />
      </section>

      {/* ---------------- EVENT DETAIL CARDS ---------------- */}
      <section className="mt-16 sm:mt-20 px-6 flex flex-col items-center">
        <span className="mx-eyebrow text-[11px] mb-3" style={{ color: "#8FA391" }}>Know Before You Go</span>
        <h2 className="text-2xl sm:text-3xl mb-10 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
          Event details
        </h2>
        <CardGrid items={detailCards} />

        <div className="mt-6 max-w-5xl w-full rounded-2xl px-6 py-5" style={{ background: "rgba(243,241,234,0.03)", border: "1px dashed rgba(243,241,234,0.16)" }}>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {presenter && <Strip icon={<UserRound className="h-4 w-4" />} label="Presented by" value={presenter} />}
            {event.doors_open_at && <Strip icon={<DoorOpen className="h-4 w-4" />} label="Gates open" value={`${formatTimeIST(event.doors_open_at)} IST`} />}
            {event.venue_address && <Strip icon={<MapPin className="h-4 w-4" />} label="Address" value={event.venue_address} />}
            {docOffer && <Strip icon={<GraduationCap className="h-4 w-4" />} label="Students & teachers" value={docOffer.name} />}
            <Strip icon={<Tickets className="h-4 w-4" />} label="Max per order" value={`${event.max_tickets_per_order} tickets`} />
            {contact && (
              <a href={`tel:${contactTel}`} className="flex items-center gap-2 hover:text-[#3FA637] transition-colors" style={{ color: C.muted }}>
                <Phone className="h-4 w-4" style={{ color: C.green }} /> Contact: <span style={{ color: C.cream }}>{contact}</span>
              </a>
            )}
          </div>
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="mt-5 max-w-5xl w-full flex flex-wrap gap-2">
            {event.tags.map((t) => (
              <span key={t} className="mx-eyebrow text-[9.5px] px-3 py-1 rounded-full" style={{ border: `1px solid ${C.line}`, color: C.muted2 }}>#{t}</span>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- TICKET BOOKING ---------------- */}
      <section ref={ticketsRef} id="tickets" className="mt-20 sm:mt-24 px-6 pb-8 flex flex-col items-center scroll-mt-20">
        <span className="mx-eyebrow text-[11px] mb-3" style={{ color: "#8FA391" }}>Tickets</span>
        <h2 className="text-2xl sm:text-3xl mb-10 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
          {salesState ? salesState.heading : "Grab your ticket"}
        </h2>

        {salesState ? (
          <SalesStateCard state={salesState} passes={salesState.showPrices ? passes : []}
            contact={contact} contactTel={contactTel} signedIn={!!session} />
        ) : (
        <div className="w-full max-w-md lg:max-w-3xl rounded-xl overflow-hidden backdrop-blur-xl"
          style={{ background: "rgba(17,24,18,0.7)", border: "1px dashed rgba(243,241,234,0.18)" }}>
          <div className="px-4 sm:px-6 pt-6 pb-4">
            <p className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <Tickets className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: C.green }} /> Get Your Ticket
            </p>
            <p className="text-sm mt-1.5" style={{ color: C.muted }}>Secure your seat at {event.title}</p>
          </div>

          <div className="px-4 sm:px-6 pb-6 lg:grid lg:grid-cols-5 lg:gap-x-10">
            {/* PASSES COLUMN */}
            <div className="space-y-4 lg:col-span-3">
              <p className="text-base font-medium">{passes.length > 1 ? "Choose your tickets" : "Ticket"}</p>
              {passes.length === 0 ? (
                <div className="rounded-xl p-6 text-center text-sm" style={{ background: "rgba(243,241,234,0.03)", border: `1px dashed ${C.line}`, color: C.muted }}>
                  Tickets will be listed here soon.
                </div>
              ) : (
                [...passes].sort((a, b) => a.sort_order - b.sort_order).map((p) => {
                  const qty = cart[p.id] || 0;
                  const buyable = sale.canBuy && p.availability === "available";
                  const low = p.remaining != null && p.remaining > 0 && p.remaining <= 20;
                  const selected = qty > 0;
                  return (
                    <div key={p.id} className="relative rounded-xl flex flex-col sm:flex-row justify-between overflow-hidden transition-colors"
                      style={{
                        background: selected ? "rgba(63,166,55,0.10)" : "rgba(63,166,55,0.04)",
                        border: `2px solid ${selected ? "rgba(63,166,55,0.55)" : "rgba(63,166,55,0.22)"}`,
                        opacity: buyable ? 1 : 0.6,
                      }}>
                      <div className="p-4 min-w-0">
                        <p className="font-semibold flex items-center gap-2 flex-wrap">
                          {p.name}
                          {p.is_super && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: C.gold, color: C.bg }}>VIP</span>}
                          {!buyable && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(243,241,234,0.1)", color: C.muted }}>{sale.canBuy ? AVAIL_LABEL[p.availability] || "Unavailable" : sale.label}</span>}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#8FA391" }}>{p.description || `Valid for entry on ${dateLabel}`}</p>
                        {p.perks && p.perks.length > 0 && (
                          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px]" style={{ color: C.muted }}>
                            {p.perks.map((perk) => <li key={perk}>✓ {perk}</li>)}
                          </ul>
                        )}
                        {low && buyable && <p className="mt-1.5 text-[11px]" style={{ color: C.gold }}>Only {p.remaining} left</p>}
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:justify-center sm:items-end gap-2 px-4 py-3 sm:min-w-[140px]"
                        style={{ borderTop: "2px dashed rgba(255,255,255,0.15)" }}>
                        <div className="sm:text-right">
                          {p.compare_at_price && toNumber(p.compare_at_price) > toNumber(p.price) && (
                            <span className="block text-xs line-through" style={{ color: C.muted2 }}>{formatMoney(p.compare_at_price)}</span>
                          )}
                          <span className="mx-tabular text-xl font-bold" style={{ color: C.green }}>{toNumber(p.price) === 0 ? "Free" : formatMoney(p.price)}</span>
                        </div>
                        {buyable && (
                          <div className="flex items-center gap-2">
                            <QtyBtn label={`Remove one ${p.name}`} onClick={() => step(p, -1)} disabled={qty === 0}><Minus className="h-4 w-4" /></QtyBtn>
                            <span className="mx-tabular w-7 text-center text-lg font-bold" aria-live="polite">{qty}</span>
                            <QtyBtn label={`Add one ${p.name}`} onClick={() => step(p, 1)}><Plus className="h-4 w-4" /></QtyBtn>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {sale.canBuy && passes.length > 0 && (
                <div className="space-y-3 pt-1">
                  {hasCodeOffers && (
                    promo ? (
                      <div className="flex items-center justify-between rounded-lg px-4 h-11 text-sm" style={{ background: C.greenSoft, color: C.green }}>
                        <span className="inline-flex items-center gap-2"><Tag className="h-3.5 w-3.5" /> <span className="mx-tabular">{promo}</span> applied</span>
                        <button onClick={() => { setPromo(""); setPromoInput(""); }} aria-label="Remove code" className="p-1 rounded-full hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <form onSubmit={applyPromo} className="flex gap-2">
                        <input className="mx-input !h-11 !rounded-lg mx-tabular uppercase" placeholder="Promo code" value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value); setPromoError(null); }} aria-invalid={!!promoError} />
                        <button type="submit" disabled={!promoInput.trim()} className="px-4 h-11 rounded-lg text-sm font-semibold disabled:opacity-40"
                          style={{ background: "rgba(243,241,234,0.06)", border: "1px solid rgba(243,241,234,0.16)" }}>Apply</button>
                      </form>
                    )
                  )}
                  {promoError && <p className="text-[12.5px]" style={{ color: C.red }}>{promoError}</p>}
                  {docOffers.length > 0 && (
                    <label className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm cursor-pointer select-none"
                      style={{ background: "rgba(232,184,75,0.07)", border: "1px solid rgba(232,184,75,0.22)", color: C.cream }}>
                      <input type="checkbox" checked={hasStudentId} onChange={(e) => setHasStudentId(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#3FA637]" />
                      <span>
                        I&apos;m a student / teacher
                        <span className="block text-[11.5px] mt-0.5" style={{ color: C.muted }}>{docOffers[0].name} — upload a valid ID at checkout.</span>
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* ORDER SUMMARY SIDEBAR */}
            <div className="lg:col-span-2 mt-8 lg:mt-0 lg:pl-8 lg:border-l lg:border-dashed lg:border-white/15">
              <div className="lg:sticky lg:top-24 space-y-5">
                <p className="text-base font-medium">Order summary</p>
                <div className="p-4 rounded-lg space-y-2 text-sm" style={{ background: "rgba(11,20,16,0.5)", border: "1px solid rgba(243,241,234,0.1)", opacity: quoting ? 0.6 : 1, transition: "opacity .2s" }}>
                  {!items.length ? (
                    <p style={{ color: C.muted }}>{sale.canBuy ? "Add tickets to see your total." : sale.label}</p>
                  ) : quote ? (
                    <>
                      {quote.items.map((l) => (
                        <SumRow key={l.ticket_type_id} label={`${l.name} (${l.quantity} × ${formatMoney(l.unit_price)})`} value={formatMoney(l.line_subtotal)} />
                      ))}
                      {quote.applied_offers.filter((o) => toNumber(o.discount_amount) > 0).map((o) => (
                        <SumRow key={o.offer_id} label={o.name} value={`−${formatMoney(o.discount_amount)}`} tone="gold" />
                      ))}
                      {toNumber(quote.service_fee) > 0 && <SumRow label="Service fee" value={formatMoney(quote.service_fee)} tone="muted" />}
                      {toNumber(quote.tax_amount) > 0 && <SumRow label="Tax" value={formatMoney(quote.tax_amount)} tone="muted" />}
                      <div className="flex justify-between text-lg font-semibold pt-2" style={{ borderTop: "1px solid rgba(243,241,234,0.1)" }}>
                        <span>Total</span>
                        <span className="mx-tabular" style={{ color: C.green }}>{formatMoney(quote.total_amount)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="flex items-center gap-2" style={{ color: C.muted }}><Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculating…</p>
                  )}
                </div>

                {error && <Notice>{error}</Notice>}

                <button type="button" onClick={proceed} disabled={!sale.canBuy || !quote || quoting || !items.length}
                  className="w-full h-11 sm:h-12 rounded-md text-base sm:text-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] sm:hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{ background: C.green, color: C.bg }}>
                  {!sale.canBuy
                    ? sale.label
                    : !items.length
                      ? "Select tickets"
                      : session
                        ? <>Proceed to Checkout <ArrowRight className="h-5 w-5" /></>
                        : <>Log in to Proceed <ArrowRight className="h-5 w-5" /></>}
                </button>
                {sale.canBuy && !session && items.length > 0 && (
                  <p className="text-center text-xs" style={{ color: C.muted2 }}>New here? You can sign up on the next screen — your tickets are saved.</p>
                )}
                {contact && (
                  <p className="text-center text-xs flex items-center justify-center gap-1.5" style={{ color: C.muted2 }}>
                    <Phone className="h-3.5 w-3.5" style={{ color: C.green }} />
                    Need help booking? Call{" "}
                    <a href={`tel:${contactTel}`} className="hover:text-[#3FA637] transition-colors" style={{ color: "#8FA391" }}>{contact}</a>
                  </p>
                )}
                <p className="text-center text-xs" style={{ color: C.muted2 }}>
                  Tickets are sold by Mateng as ticketing partner, subject to the{" "}
                  <Link href={TICKETING_TERMS_PATH} className="underline underline-offset-4 hover:text-[#3FA637]" style={{ color: "#8FA391" }}>
                    Mateng Event Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
        )}
      </section>

      <section className="mt-12 px-6 flex justify-center">
        <BookingHelpCta className="max-w-3xl"
          message={`Hi Mateng, I need help with booking tickets for "${event.title}".`} />
      </section>
    </Shell>
  );
}

type SalesState = {
  heading: string;
  title: string;
  text: string;
  tone: "red" | "gold" | "muted";
  icon: "lock" | "pause" | "clock" | "ended" | "cancelled";
  /** Show pass names + prices read-only (useful when sales will (re)open). */
  showPrices: boolean;
};

/** Copy for each event status that can't take orders. */
function salesStateCopy(status: string, title: string, pauseReason?: string | null): SalesState {
  switch (status) {
    case "tickets_closed":
      return { heading: "Ticket sales closed", title: "Tickets Closed", tone: "red", icon: "lock", showPrices: false,
        text: `Ticket sales for ${title} have closed. Already booked? Your tickets are still valid for entry.` };
    case "paused":
      return { heading: "Sales paused", title: "Sales Paused", tone: "gold", icon: "pause", showPrices: true,
        text: `Ticket sales for ${title} are paused for now${pauseReason ? ` — ${pauseReason.replace(/\.$/, "")}` : ""}. Please check back soon. Tickets already booked stay valid.` };
    case "published":
      return { heading: "Tickets coming soon", title: "Sales Open Soon", tone: "gold", icon: "clock", showPrices: true,
        text: `Tickets for ${title} aren't on sale yet. Check back soon.` };
    case "completed":
      return { heading: "Event ended", title: "Event Ended", tone: "muted", icon: "ended", showPrices: false,
        text: `${title} has ended. Thanks to everyone who came!` };
    case "cancelled":
      return { heading: "Event cancelled", title: "Event Cancelled", tone: "red", icon: "cancelled", showPrices: false,
        text: `${title} has been cancelled. If you booked, Mateng will contact you about your refund.` };
    default:
      return { heading: "Not on sale", title: "Not On Sale", tone: "muted", icon: "clock", showPrices: false,
        text: `Tickets for ${title} aren't available right now.` };
  }
}

const TONE: Record<SalesState["tone"], string> = { red: C.red, gold: C.gold, muted: C.muted };

function SalesStateCard({ state, passes, contact, contactTel, signedIn }: {
  state: SalesState; passes: TicketType[]; contact?: string; contactTel: string; signedIn: boolean;
}) {
  const color = TONE[state.tone];
  const Icon = { lock: Lock, pause: PauseCircle, clock: Clock, ended: CalendarCheck, cancelled: XCircle }[state.icon];
  return (
    <div className="w-full max-w-md rounded-xl text-center px-6 py-9"
      style={{ background: "rgba(243,241,234,0.03)", border: "1px dashed rgba(243,241,234,0.18)" }}>
      <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4"
        style={{ background: `${color}24`, border: `1px solid ${color}52` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <p className="text-2xl font-semibold">{state.title}</p>
      <p className="mt-2 text-sm max-w-xs mx-auto leading-relaxed" style={{ color: C.muted }}>{state.text}</p>

      {passes.length > 0 && (
        <div className="mt-6 text-left rounded-lg overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {[...passes].sort((a, b) => a.sort_order - b.sort_order).map((p, i) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              style={{ borderTop: i ? `1px dashed ${C.line}` : undefined }}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="truncate">{p.name}</span>
                {p.is_super && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ background: C.gold, color: C.bg }}>VIP</span>}
              </span>
              <span className="mx-tabular shrink-0" style={{ color: C.cream }}>{toNumber(p.price) === 0 ? "Free" : formatMoney(p.price)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button type="button" disabled className="w-full h-12 rounded-md font-semibold inline-flex items-center justify-center gap-2 cursor-not-allowed"
          style={{ background: "rgba(243,241,234,0.08)", color: C.muted }}>
          <Tickets className="h-4 w-4" /> {state.title}
        </button>
        {signedIn && (
          <Link href="/account/bookings" className="text-sm font-semibold hover:underline" style={{ color: C.green }}>View my bookings →</Link>
        )}
        {contact && (
          <a href={`tel:${contactTel}`} className="text-xs inline-flex items-center justify-center gap-1.5 hover:text-[#3FA637]" style={{ color: C.muted2 }}>
            <Phone className="h-3.5 w-3.5" style={{ color: C.green }} /> Questions? Call {contact}
          </a>
        )}
      </div>
    </div>
  );
}

function HeroChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm"
      style={{ background: "rgba(243,241,234,0.08)", border: "1px solid rgba(243,241,234,0.16)" }}>
      <span style={{ color: C.green }}>{icon}</span>{children}
    </span>
  );
}

function CardGrid({ items, className = "" }: { items: { icon: React.ReactNode; label: string; value: string }[]; className?: string }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl w-full ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl p-5 sm:p-6 text-left"
          style={{ background: "rgba(243,241,234,0.03)", border: "1px dashed rgba(243,241,234,0.16)" }}>
          <div className="mb-3" style={{ color: C.green }}>{item.icon}</div>
          <span className="mx-eyebrow text-[9px]" style={{ color: C.gold }}>{item.label}</span>
          <p className="mt-1.5 text-sm sm:text-base leading-snug">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function Strip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="flex items-center gap-2" style={{ color: C.muted }}>
      <span style={{ color: C.green }}>{icon}</span>
      {label}: <span style={{ color: C.cream }}>{value}</span>
    </span>
  );
}

function SumRow({ label, value, tone }: { label: string; value: string; tone?: "gold" | "muted" }) {
  const color = tone === "gold" ? C.gold : tone === "muted" ? C.muted : C.cream;
  return (
    <div className="flex justify-between gap-4" style={{ color }}>
      <span>{label}</span>
      <span className="mx-tabular">{value}</span>
    </div>
  );
}

function QtyBtn({ children, onClick, disabled, label }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className="h-10 w-10 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-90 hover:bg-white/10"
      style={{ background: "rgba(243,241,234,0.06)", border: "1px solid rgba(243,241,234,0.16)" }}>
      {children}
    </button>
  );
}
