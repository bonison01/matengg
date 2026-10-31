"use client";
// /account/bookings — the customer's orders from the centralized events API.

import React, { useEffect, useMemo, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import BookingHelpCta from "@/components/events-api/BookingHelpCta";
import { useRouter } from "next/navigation";
import { CalendarDays, Download, Loader2, Ticket } from "lucide-react";
import { bookingService } from "@/lib/api/service";
import { ApiError } from "@/lib/api/api";
import { useCustomer } from "@/lib/api/useCustomer";
import { formatDateIST, formatMoney, formatTimeIST } from "@/lib/api/format";
import type { MyOrder } from "@/lib/api/types";
import { Btn, C, Notice, PageSpinner, PaymentBadge, Shell } from "./ui";

const PAGE = 20;

export default function BookingsPage() {
  const router = useRouter();
  const { session, ready } = useCustomer();
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !session) router.replace("/account/login?redirect=/account/bookings");
  }, [ready, session, router]);

  useEffect(() => {
    if (!ready || !session) return;
    let cancelled = false;
    bookingService.myOrders(0, PAGE)
      .then(async (r) => {
        if (cancelled) return;
        setOrders(r.items);
        setTotal(r.total);
        // A pending order may already be paid on Razorpay (lost redirect):
        // re-check those and reload if any changed.
        const pending = r.items.filter((o) => o.payment_status === "pending" && o.payment_url).slice(0, 5);
        if (!pending.length) return;
        const synced = await Promise.all(pending.map((o) => bookingService.syncPayment(o.order_number).catch(() => null)));
        if (cancelled || !synced.some((s) => s && s.payment_status !== "pending")) return;
        const fresh = await bookingService.myOrders(0, PAGE);
        if (!cancelled) { setOrders(fresh.items); setTotal(fresh.total); }
      })
      .catch((e: ApiError) => setError(e.message));
    return () => { cancelled = true; };
  }, [ready, session?.user_id]);

  const loadMore = async () => {
    if (!orders) return;
    setLoadingMore(true);
    try {
      const r = await bookingService.myOrders(orders.length, PAGE);
      setOrders([...orders, ...r.items]);
      setTotal(r.total);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setLoadingMore(false);
    }
  };

  const groups = useMemo(() => {
    const now = Date.now();
    const upcoming: MyOrder[] = [], pending: MyOrder[] = [], past: MyOrder[] = [];
    for (const o of orders || []) {
      const paid = o.payment_status === "paid" || o.payment_status === "success";
      const future = !o.event_starts_at || new Date(o.event_starts_at).getTime() > now;
      const held = !!o.hold_expires_at && new Date(o.hold_expires_at).getTime() > now;
      if (o.payment_status === "pending" && o.payment_url && held) pending.push(o);
      else if (paid && future) upcoming.push(o);
      else past.push(o);
    }
    return { upcoming, pending, past };
  }, [orders]);

  const download = async (n: string) => {
    setDownloading(n);
    setError(null);
    try { await bookingService.downloadMyTickets(n); }
    catch { setError("Tickets aren't available for that order yet."); }
    finally { setDownloading(null); }
  };

  if (!ready || !session) return <Shell><PageSpinner /></Shell>;

  return (
    <Shell>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14">
        <span className="mx-eyebrow text-[11px]" style={{ color: C.muted }}>Your account</span>
        <h1 className="mx-display text-4xl sm:text-5xl mt-2">My bookings</h1>
        <p className="mt-3 text-sm" style={{ color: C.muted }}>
          Signed in as <span style={{ color: C.cream }}>{session.full_name || session.username}</span>
          {session.email ? ` · ${session.email}` : ""}
        </p>

        {error && <div className="mt-6"><Notice>{error}</Notice></div>}

        {!orders ? (
          !error && <PageSpinner label="Loading your bookings…" />
        ) : orders.length === 0 ? (
          <div className="mx-card mt-10 p-10 text-center">
            <Ticket className="h-9 w-9 mx-auto" style={{ color: C.green }} />
            <p className="mx-display text-2xl mt-4">No bookings yet</p>
            <p className="mt-2 text-sm" style={{ color: C.muted }}>When you book an event, your tickets show up here.</p>
            <Link href="/events" className="inline-block mt-6"><Btn>Explore events</Btn></Link>
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            <Group title="Awaiting payment" orders={groups.pending} downloading={downloading} onDownload={download} />
            <Group title="Upcoming" orders={groups.upcoming} downloading={downloading} onDownload={download} />
            <Group title="Past & cancelled" orders={groups.past} downloading={downloading} onDownload={download} dim />
            {orders.length < total && (
              <div className="text-center"><Btn variant="ghost" loading={loadingMore} onClick={loadMore}>Load more</Btn></div>
            )}
          </div>
        )}

        {(orders || error) && <BookingHelpCta className="mt-12" message="Hi Mateng, I need help with my ticket booking." />}
      </div>
    </Shell>
  );
}

/** Inside the Link: spins while the tickets page is loading. */
function ViewTicketsLabel() {
  const { pending } = useLinkStatus();
  return pending
    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening…</>
    : <><Ticket className="h-3.5 w-3.5" /> View tickets</>;
}

function Group({ title, orders, downloading, onDownload, dim }: {
  title: string; orders: MyOrder[]; downloading: string | null; onDownload: (n: string) => void; dim?: boolean;
}) {
  if (!orders.length) return null;
  return (
    <section>
      <h2 className="mx-eyebrow text-[11px] mb-4" style={{ color: C.muted }}>{title} · {orders.length}</h2>
      <div className="space-y-3">
        {orders.map((o) => {
          const paid = o.payment_status === "paid" || o.payment_status === "success";
          const holdLeft = o.hold_expires_at ? new Date(o.hold_expires_at).getTime() - Date.now() : 0;
          return (
            <div key={o.order_number} className="rounded-2xl flex flex-col sm:flex-row sm:items-stretch overflow-hidden"
              style={{ background: C.surface, border: `1px solid ${C.line}`, opacity: dim ? 0.8 : 1 }}>
              <div className="flex-1 p-5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <PaymentBadge status={o.payment_status} />
                  <span className="mx-tabular text-[11.5px]" style={{ color: C.muted2 }}>{o.order_number}</span>
                </div>
                {o.event_slug ? (
                  <Link href={`/events/${o.event_slug}`} className="mx-display text-xl mt-2 block hover:underline underline-offset-4">{o.event_title || "Event"}</Link>
                ) : (
                  <p className="mx-display text-xl mt-2">{o.event_title || "Event"}</p>
                )}
                {o.event_starts_at && (
                  <p className="mt-1.5 text-[13px] flex items-center gap-1.5" style={{ color: C.muted }}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateIST(o.event_starts_at, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {formatTimeIST(o.event_starts_at)}
                  </p>
                )}
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 px-5 py-4 sm:py-5 sm:min-w-[200px]"
                style={{ borderTop: `1px dashed ${C.lineStrong}` }}>
                <div className="sm:text-right">
                  <p className="mx-tabular text-lg">{formatMoney(o.total_amount, o.currency || "INR")}</p>
                  <p className="text-[12px]" style={{ color: C.muted2 }}>{o.qty} {o.qty === 1 ? "pass" : "passes"}</p>
                </div>
                {paid && o.tickets_generated ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => onDownload(o.order_number)} disabled={downloading === o.order_number}
                      aria-label="Download receipt PDF" title="Receipt PDF"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-full disabled:opacity-50 hover:bg-white/5 transition"
                      style={{ border: `1px solid ${C.lineStrong}`, color: C.muted }}>
                      {downloading === o.order_number ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    </button>
                    <Link href={`/account/bookings/${encodeURIComponent(o.order_number)}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold h-9 px-4 rounded-full transition hover:brightness-110"
                      style={{ background: C.green, color: C.bg }}>
                      <ViewTicketsLabel />
                    </Link>
                  </div>
                ) : o.payment_status === "pending" && o.payment_url && holdLeft > 0 ? (
                  <a href={o.payment_url} className="inline-flex items-center text-sm font-semibold h-9 px-4 rounded-full"
                    style={{ background: C.gold, color: C.bg }}>Complete payment</a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
