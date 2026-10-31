"use client";
// Payment return page for API events. Razorpay → API → 302 here with
// ?payment=success|error&merchantOrderId=…  The URL is only a hint; the order
// status endpoint is the truth.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Download, Loader2, RotateCcw, XCircle } from "lucide-react";
import { bookingService } from "@/lib/api/service";
import { ApiError } from "@/lib/api/api";
import { useCustomer } from "@/lib/api/useCustomer";
import { formatMoney } from "@/lib/api/format";
import { checkoutStore } from "@/lib/events/apiEvents";
import type { PublicOrder, TicketWallet } from "@/lib/api/types";
import { Btn, C, Notice, PageSpinner, Shell } from "./ui";
import TicketWalletView from "./tickets/TicketWalletView";

const POLL_MS = 2500;
const POLL_MAX_MS = 30_000;

export default function ConfirmationPage({ slug: slugProp }: { slug?: string }) {
  const params = useSearchParams();
  const { session, ready } = useCustomer();
  const paymentHint = params.get("payment"); // "success" | "error" | null
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | undefined>(slugProp);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [wallet, setWallet] = useState<TicketWallet | null>(null);
  const [walletFailed, setWalletFailed] = useState(false);
  const startedAt = useRef(Date.now());

  // Resolve the order number: ?order= → saved before redirect → newest booking.
  useEffect(() => {
    if (!ready) return;
    const fromUrl = params.get("order");
    const saved = checkoutStore.loadLastOrder();
    if (fromUrl) { setOrderNumber(fromUrl); if (saved?.orderNumber === fromUrl) setSlug((s) => s || saved.slug); return; }
    if (saved) { setOrderNumber(saved.orderNumber); setSlug((s) => s || saved.slug); return; }
    if (session) {
      bookingService.myOrders(0, 1)
        .then((r) => {
          const o = r.items[0];
          if (o) { setOrderNumber(o.order_number); setSlug((s) => s || o.event_slug || undefined); }
          else setError("We couldn't find your order.");
        })
        .catch((e: ApiError) => setError(e.message));
    } else {
      setError("We couldn't find your order on this device. Log in to see your bookings.");
    }
  }, [ready, session, params]);

  // Fetch + poll until tickets are issued (the webhook can land a little later).
  useEffect(() => {
    if (!orderNumber) return;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    let ticks = 0;
    const tick = async () => {
      try {
        let o = await bookingService.orderStatus(orderNumber);
        // Still pending? Have the API check Razorpay directly — covers a lost
        // redirect/webhook. First tick, then every few while polling.
        if (o.payment_status === "pending" && ticks++ % 4 === 0) {
          o = await bookingService.syncPayment(orderNumber).catch(() => o);
        }
        if (stopped) return;
        setOrder(o);
        const paid = o.payment_status === "paid" || o.payment_status === "success";
        const waiting =
          (paid && !o.tickets_generated) || (paymentHint === "success" && o.payment_status === "pending");
        if (waiting && Date.now() - startedAt.current < POLL_MAX_MS) {
          setPolling(true);
          timer = setTimeout(tick, POLL_MS);
        } else setPolling(false);
      } catch (e) {
        if (!stopped) setError((e as ApiError).message);
      }
    };
    tick();
    return () => { stopped = true; clearTimeout(timer); };
  }, [orderNumber, paymentHint]);

  // Once tickets are issued, load them to show on screen. Owner endpoint when
  // signed in (full details), else the order-number one.
  const ticketsReady = !!order?.tickets_generated && (order.payment_status === "paid" || order.payment_status === "success");
  useEffect(() => {
    if (!ticketsReady || !order || wallet) return;
    const n = order.order_number;
    (session ? bookingService.myTicketWallet(n).catch(() => bookingService.ticketWallet(n)) : bookingService.ticketWallet(n))
      .then(setWallet)
      .catch(() => setWalletFailed(true)); // the PDF button stays as the fallback
  }, [ticketsReady, order?.order_number, session?.user_id]);

  const download = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      if (session) await bookingService.downloadMyTickets(order.order_number).catch(() => bookingService.downloadTickets(order.order_number));
      else await bookingService.downloadTickets(order.order_number);
    } catch {
      setError("Tickets aren't ready to download yet. Try again in a moment.");
    } finally {
      setDownloading(false);
    }
  };

  const status = order?.payment_status;
  const paid = status === "paid" || status === "success";
  const holdActive = !!order?.hold_expires_at && new Date(order.hold_expires_at).getTime() > Date.now();
  const failed = status === "failed" || status === "expired" || status === "cancelled" || (paymentHint === "error" && !paid && !(status === "pending" && order?.payment_url && holdActive));

  let body: React.ReactNode;
  if (!order && !error) body = <PageSpinner label="Checking your payment…" />;
  else if (!order) body = (
    <StateCard icon={<XCircle className="h-8 w-8" style={{ color: C.red }} />} title="Order not found" text={error!}>
      <Link href={session ? "/account/bookings" : "/account/login?redirect=/account/bookings"}><Btn>{session ? "My bookings" : "Log in"}</Btn></Link>
      <Link href="/events"><Btn variant="ghost">Browse events</Btn></Link>
    </StateCard>
  );
  else if (paid) body = (
    <StateCard
      icon={<CheckCircle2 className="h-9 w-9" style={{ color: C.green }} />}
      title="You're going!"
      text={order.tickets_generated
        ? <>Your tickets have been sent to <span style={{ color: C.cream }}>{order.email_masked}</span>.</>
        : <>Payment received. We&apos;re issuing your tickets{polling && <Loader2 className="inline h-3.5 w-3.5 ml-2 animate-spin" />}</>}
      order={order}
    >
      {!wallet && <Btn onClick={download} loading={downloading} disabled={!order.tickets_generated}><Download className="h-4 w-4" /> Download tickets</Btn>}
      <Link href={session ? "/account/bookings" : "/events"}><Btn variant="ghost">{session ? "My bookings" : "More events"}</Btn></Link>
    </StateCard>
  );
  else if (status === "pending" && !failed) body = (
    <StateCard
      icon={polling ? <Loader2 className="h-8 w-8 animate-spin" style={{ color: C.gold }} /> : <Clock3 className="h-8 w-8" style={{ color: C.gold }} />}
      title={polling ? "Confirming your payment…" : "Payment not completed"}
      text={polling ? "This usually takes a few seconds." : holdActive ? "Your seats are still held. Finish paying to confirm them." : "Your seat hold has run out."}
      order={order}
    >
      {!polling && order.payment_url && holdActive && (
        <Btn onClick={() => { window.location.href = order.payment_url!; }}><RotateCcw className="h-4 w-4" /> Try again</Btn>
      )}
      {!polling && <Link href={slug ? `/events/${slug}` : "/events"}><Btn variant="ghost">Back to event</Btn></Link>}
    </StateCard>
  );
  else body = (
    <StateCard icon={<XCircle className="h-8 w-8" style={{ color: C.red }} />}
      title={status === "expired" ? "Your seat hold expired" : status === "cancelled" ? "Order cancelled" : "Payment failed"}
      text="No money was taken for this order. You can start again from the event page." order={order}>
      <Link href={slug ? `/events/${slug}` : "/events"}><Btn>Start again</Btn></Link>
    </StateCard>
  );

  return (
    <Shell>
      <div className="max-w-xl mx-auto px-5 pt-14 sm:pt-20">
        {body}
        {order && error && <div className="mt-4"><Notice>{error}</Notice></div>}
      </div>
      {paid && ticketsReady && !wallet && !walletFailed && <PageSpinner label="Loading your tickets…" />}
      {paid && wallet && (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-14">
          <TicketWalletView wallet={wallet} onDownloadReceipt={download} />
        </div>
      )}
    </Shell>
  );
}

function StateCard({ icon, title, text, order, children }: {
  icon: React.ReactNode; title: string; text: React.ReactNode; order?: PublicOrder; children?: React.ReactNode;
}) {
  return (
    <div className="mx-card mx-glow overflow-hidden text-center mx-rise">
      <div className="px-6 sm:px-10 pt-10 pb-8">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(243,241,234,0.05)" }}>{icon}</div>
        <h1 className="mx-display text-3xl">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.muted }}>{text}</p>
      </div>
      {order && (
        <div className="grid grid-cols-3 text-left" style={{ borderTop: `1px dashed ${C.lineStrong}` }}>
          <Cell label="Order" value={order.order_number} />
          <Cell label="Passes" value={String(order.qty)} />
          <Cell label="Total" value={formatMoney(order.total_amount, order.currency || "INR")} />
        </div>
      )}
      {children && <div className="flex flex-wrap justify-center gap-3 px-6 py-6" style={{ borderTop: `1px dashed ${C.lineStrong}` }}>{children}</div>}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 sm:px-5 py-4 min-w-0 [&+&]:border-l [&+&]:border-dashed [&+&]:border-[rgba(243,241,234,0.22)]">
      <p className="mx-eyebrow text-[9px]" style={{ color: C.muted2 }}>{label}</p>
      <p className="mx-tabular text-[13px] mt-1 truncate">{value}</p>
    </div>
  );
}
