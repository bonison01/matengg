"use client";
// One on-screen ticket for an events-API order. It carries the same facts the
// backend ticket PDF prints (event_ticket_pdf.py): presenter, title, pass
// tier, date, time, doors, venue, holder, order number and the QR, which
// encodes the raw ticket_code the gate scanner reads.
//
// It is also the export source: ticketExport.ts snapshots this node to PNG /
// PDF, so everything here is plain DOM with explicit colours (no theme vars
// that would be lost in the snapshot), and the notches are real cut-outs
// (CSS masks) so they stay transparent in the image.

import React, { forwardRef, useState } from "react";
import QRCode from "react-qr-code";
import type { WalletEvent, WalletOrder, WalletTicket } from "@/lib/api/types";
import { formatDateIST, formatTimeIST } from "@/lib/api/format";

const INK = "#0B1410";
const CREAM = "#F3F1EA";

const LOOK = {
  standard: {
    accent: "#3FA637",
    accentInk: "#0B1410",
    soft: "rgba(63,166,55,0.14)",
    foil: "linear-gradient(90deg,#1f6b1a 0%,#3FA637 35%,#b9e5a4 50%,#3FA637 65%,#1f6b1a 100%)",
    edge: "rgba(63,166,55,0.35)",
    glow: "rgba(63,166,55,0.22)",
    label: "Admit one",
  },
  vip: {
    accent: "#E8B84B",
    accentInk: "#1b1405",
    soft: "rgba(232,184,75,0.14)",
    foil: "linear-gradient(90deg,#8a6420 0%,#E8B84B 30%,#fff1c7 50%,#E8B84B 70%,#8a6420 100%)",
    edge: "rgba(232,184,75,0.45)",
    glow: "rgba(232,184,75,0.22)",
    label: "VIP · Admit one",
  },
};

/** Posters live on S3 without CORS; /_next/image serves them same-origin so
 *  the PNG snapshot can embed them. */
export function posterSrc(url?: string | null) {
  if (!url) return null;
  return `/_next/image?url=${encodeURIComponent(url)}&w=828&q=75`; // q must be in images.qualities (default [75])
}

const NOTCH = 13; // px radius of the side cut-outs at the tear line
const cut = (corner: "bottom" | "top"): React.CSSProperties => {
  const y = corner === "bottom" ? "100%" : "0";
  const m = `radial-gradient(circle ${NOTCH}px at 0 ${y}, #0000 ${NOTCH - 0.5}px, #000 ${NOTCH}px), radial-gradient(circle ${NOTCH}px at 100% ${y}, #0000 ${NOTCH - 0.5}px, #000 ${NOTCH}px)`;
  return { WebkitMaskImage: m, maskImage: m, WebkitMaskComposite: "source-in", maskComposite: "intersect" };
};

type Props = {
  ticket: WalletTicket;
  total: number;
  event: WalletEvent;
  order: Pick<WalletOrder, "order_number" | "buyer_name">;
};

const PremiumTicket = forwardRef<HTMLDivElement, Props>(function PremiumTicket({ ticket, total, event, order }, ref) {
  const vip = !!ticket.is_super;
  const L = vip ? LOOK.vip : LOOK.standard;
  const [posterOk, setPosterOk] = useState(true);
  const poster = posterOk ? posterSrc(event.poster_url) : null;
  const revoked = ticket.status === "revoked";
  const used = !revoked && (ticket.is_used || ticket.status === "used");
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      ref={ref}
      className="relative w-full max-w-[360px] select-none"
      style={{ fontFamily: "var(--font-body)", color: CREAM, filter: `drop-shadow(0 24px 40px ${L.glow})` }}
      aria-label={`${event.title} ticket ${ticket.ticket_number} of ${total}`}
    >
      {/* ── Main body ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-t-[26px]" style={{ background: "#0E1913", ...cut("bottom") }}>
        {/* Foil edge */}
        <div className="absolute inset-x-0 top-0 h-[3px] z-20" style={{ background: L.foil }} />

        {/* Hero */}
        <div className="relative h-[232px] overflow-hidden">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" onError={() => setPosterOk(false)} className="absolute inset-0 w-full h-full object-cover" style={{ transform: "scale(1.04)" }} />
          ) : (
            <div className="absolute inset-0" style={{
              background: `radial-gradient(120% 90% at 85% 0%, ${L.glow} 0%, transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(63,166,55,0.18) 0%, transparent 60%), repeating-linear-gradient(135deg, rgba(243,241,234,0.035) 0 1px, transparent 1px 11px), #0B1410`,
            }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,20,16,0.55) 0%, rgba(11,20,16,0.15) 32%, rgba(14,25,19,0.82) 72%, #0E1913 100%)" }} />

          <div className="relative z-10 flex items-center justify-between px-5 pt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Mateng" className="h-[22px] w-auto" />
            <span className="text-[9px] font-semibold px-2.5 py-1 rounded-full"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.18em", textTransform: "uppercase", background: "rgba(11,20,16,0.55)", border: `1px solid ${L.edge}`, color: L.accent, backdropFilter: "blur(6px)" }}>
              {L.label}
            </span>
          </div>

          <div className="absolute z-10 inset-x-0 bottom-0 px-5 pb-4">
            {event.presenter_line && (
              <p className="text-[9.5px] mb-1.5" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em", textTransform: "uppercase", color: L.accent }}>
                {event.presenter_line}
              </p>
            )}
            <h3 className="text-[30px] leading-[1.02] line-clamp-2" style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.01em", textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}>
              {event.title}
            </h3>
            {event.subtitle && <p className="mt-1 text-[12.5px] line-clamp-1" style={{ color: "rgba(243,241,234,0.72)" }}>{event.subtitle}</p>}
          </div>
        </div>

        {/* Details */}
        <div className="px-5 pt-3 pb-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold px-3 py-[5px] rounded-full truncate max-w-[62%]"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase", background: L.accent, color: L.accentInk }}>
              {ticket.tier_name}
            </span>
            <span className="text-[11px] shrink-0" style={{ fontFamily: "var(--font-mono)", color: "rgba(243,241,234,0.6)" }}>
              No. <span style={{ color: CREAM }}>{pad(ticket.ticket_number)}</span> / {pad(total)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-5">
            <Fact label="Date" value={event.date_text} />
            <Fact label="Time" value={event.time_text} />
            {event.doors_open_text && <Fact label="Doors open" value={event.doors_open_text} />}
            <Fact label="Holder" value={ticket.holder_name || order.buyer_name} />
            <div className="col-span-2">
              <Fact label="Venue" value={event.venue_line} />
              {event.venue_address && <p className="mt-1 text-[11.5px] leading-snug line-clamp-2" style={{ color: "rgba(243,241,234,0.55)" }}>{event.venue_address}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stub (QR) ─────────────────────────────────────────────────── */}
      <div className="relative rounded-b-[26px] overflow-hidden" style={{ background: "#14221A", ...cut("top") }}>
        {/* Tear line */}
        <div className="absolute top-0 left-[18px] right-[18px] h-0" style={{ borderTop: "2px dashed rgba(243,241,234,0.2)" }} />

        <div className="px-5 pt-6 pb-5 flex flex-col items-center">
          <div className="relative rounded-[18px] p-3" style={{ background: CREAM, boxShadow: `0 0 0 1px ${L.edge}, 0 10px 30px -12px rgba(0,0,0,0.6)` }}>
            <div style={{ filter: revoked ? "blur(5px)" : undefined, opacity: used ? 0.35 : 1 }}>
              <QRCode value={ticket.ticket_code} size={172} level="H" fgColor={INK} bgColor={CREAM} />
            </div>
            {(used || revoked) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-bold px-3 py-1.5 rounded-md -rotate-12"
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.16em", textTransform: "uppercase", color: revoked ? "#b3261e" : "#1f6b1a", border: `2px solid ${revoked ? "#b3261e" : "#1f6b1a"}`, background: "rgba(243,241,234,0.9)" }}>
                  {revoked ? "Cancelled" : "Checked in"}
                </span>
              </div>
            )}
          </div>

          <p className="mt-4 text-[10px] font-semibold" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.22em", textTransform: "uppercase", color: L.accent }}>
            {revoked ? "Not valid for entry" : used ? `Scanned ${ticket.scanned_at ? `${formatDateIST(ticket.scanned_at, { day: "numeric", month: "short" })}, ${formatTimeIST(ticket.scanned_at)}` : ""}` : "Scan at entry"}
          </p>
          <p className="mt-1.5 text-[10px] break-all text-center" style={{ fontFamily: "var(--font-mono)", color: "rgba(243,241,234,0.45)" }}>
            {ticket.ticket_code}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3 text-[10px]"
          style={{ fontFamily: "var(--font-mono)", color: "rgba(243,241,234,0.55)", background: "rgba(0,0,0,0.18)", borderTop: "1px solid rgba(243,241,234,0.08)" }}>
          <span className="truncate">Order <span style={{ color: CREAM }}>{order.order_number}</span></span>
          <span className="shrink-0">{event.website}</span>
        </div>
      </div>
    </div>
  );
});

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px]" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(243,241,234,0.5)" }}>{label}</p>
      <p className="mt-1 text-[13.5px] font-semibold leading-snug" style={{ color: CREAM }}>{value}</p>
    </div>
  );
}

export default PremiumTicket;
