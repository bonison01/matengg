"use client";
// /account/bookings/[orderNumber] — the signed-in buyer's tickets for one
// order, drawn on screen with their QR codes and downloadable.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import BookingHelpCta from "@/components/events-api/BookingHelpCta";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Ticket } from "lucide-react";
import { bookingService } from "@/lib/api/service";
import { ApiError } from "@/lib/api/api";
import { useCustomer } from "@/lib/api/useCustomer";
import { formatMoney } from "@/lib/api/format";
import type { TicketWallet } from "@/lib/api/types";
import { Btn, C, PageSpinner, PaymentBadge, Shell } from "./ui";
import TicketWalletView from "./tickets/TicketWalletView";

export default function TicketsPage({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const { session, ready } = useCustomer();
  const [wallet, setWallet] = useState<TicketWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !session) router.replace(`/account/login?redirect=${encodeURIComponent(`/account/bookings/${orderNumber}`)}`);
  }, [ready, session, router, orderNumber]);

  useEffect(() => {
    if (!ready || !session) return;
    let cancelled = false;
    bookingService.myTicketWallet(orderNumber)
      .then((w) => { if (!cancelled) setWallet(w); })
      .catch((e: ApiError) => {
        if (!cancelled) setError(e.status === 404 ? "Tickets for this order aren't available yet." : e.message);
      });
    return () => { cancelled = true; };
  }, [ready, session?.user_id, orderNumber]);

  if (!ready || !session) return <Shell><PageSpinner /></Shell>;

  return (
    <Shell>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12">
        <Link href="/account/bookings" className="inline-flex items-center gap-1.5 text-[13px] hover:underline underline-offset-4" style={{ color: C.muted }}>
          <ArrowLeft className="h-3.5 w-3.5" /> My bookings
        </Link>

        {!wallet ? (
          error ? (
            <div className="mx-card mt-8 p-10 text-center">
              <Ticket className="h-9 w-9 mx-auto" style={{ color: C.green }} />
              <p className="mx-display text-2xl mt-4">No tickets to show</p>
              <p className="mt-2 text-sm" style={{ color: C.muted }}>{error}</p>
              <Link href="/account/bookings" className="inline-block mt-6"><Btn variant="ghost">Back to bookings</Btn></Link>
            </div>
          ) : <PageSpinner label="Loading your tickets…" />
        ) : (
          <>
            <header className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <PaymentBadge status={wallet.order.payment_status} />
                <span className="mx-tabular text-[11.5px]" style={{ color: C.muted2 }}>{wallet.order.order_number}</span>
              </div>
              <h1 className="mx-display text-4xl sm:text-5xl mt-3">{wallet.event.title}</h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px]" style={{ color: C.muted }}>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {wallet.event.date_text} · {wallet.event.time_text}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {wallet.event.venue_line}</span>
                <span className="mx-tabular">{formatMoney(wallet.order.total_amount, wallet.order.currency)} paid</span>
              </div>
            </header>
            <div className="mt-10 pt-8" style={{ borderTop: `1px dashed ${C.lineStrong}` }}>
              <TicketWalletView wallet={wallet} onDownloadReceipt={() => bookingService.downloadMyTickets(orderNumber)} />
            </div>
          </>
        )}

        {(wallet || error) && (
          <BookingHelpCta className="mt-14"
            message={`Hi Mateng, I need help with my booking ${orderNumber}${wallet ? ` for "${wallet.event.title}"` : ""}.`} />
        )}
      </div>
    </Shell>
  );
}
