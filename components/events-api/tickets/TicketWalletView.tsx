"use client";
// All passes of one order as premium tickets, with per-ticket PNG download,
// an all-tickets PDF built from the same design, and the backend's
// receipt PDF (billing details) as a secondary action.

import React, { useRef, useState } from "react";
import Link from "next/link";
import { TICKETING_TERMS_PATH } from "@/lib/events/ticketingTerms";
import { Download, FileText, ImageDown, Loader2 } from "lucide-react";
import type { TicketWallet } from "@/lib/api/types";
import { downloadTicketPng, downloadTicketsPdf } from "@/lib/events/ticketExport";
import { C, Btn, Notice } from "../ui";
import PremiumTicket from "./PremiumTicket";

export default function TicketWalletView({ wallet, onDownloadReceipt }: {
  wallet: TicketWallet;
  /** Backend PDF (receipt + tickets). Omit to hide the button. */
  onDownloadReceipt?: () => Promise<void>;
}) {
  const { order, event, tickets } = wallet;
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = `${event.slug}-${order.order_number}`;

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try { await fn(); }
    catch { setError("Couldn't prepare the download. Please try again."); }
    finally { setBusy(null); }
  };

  const savePng = (i: number) => {
    const node = refs.current[i];
    if (node) run(`png-${i}`, () => downloadTicketPng(node, `${base}-ticket-${tickets[i].ticket_number}.png`));
  };
  const savePdf = () =>
    run("pdf", () => downloadTicketsPdf(refs.current.filter((n): n is HTMLDivElement => !!n), `${base}-tickets.pdf`));

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="mx-eyebrow text-[11px]" style={{ color: C.muted }}>Your passes · {tickets.length}</span>
          <p className="mt-1.5 text-[13.5px] max-w-md" style={{ color: C.muted }}>
            Each QR admits one person, once. Show it on your phone or a printout at the entrance, and don&apos;t share it.{" "}
            <Link href={TICKETING_TERMS_PATH} className="underline underline-offset-4 hover:text-[#3FA637]">Mateng Event Terms</Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Btn onClick={savePdf} loading={busy === "pdf"} disabled={!!busy} className="!h-11 !px-5 !text-[14px]">
            <Download className="h-4 w-4" /> {tickets.length > 1 ? "Download all" : "Download PDF"}
          </Btn>
          {onDownloadReceipt && (
            <Btn variant="ghost" onClick={() => run("receipt", onDownloadReceipt)} loading={busy === "receipt"} disabled={!!busy} className="!h-11 !px-5 !text-[14px]">
              <FileText className="h-4 w-4" /> Receipt
            </Btn>
          )}
        </div>
      </div>

      {error && <div className="mt-5"><Notice>{error}</Notice></div>}

      {/* Exports can take a few seconds on phones. Kept outside the ticket
          nodes so it never ends up in the snapshot. */}
      {busy && (
        <div className="fixed z-50 inset-x-0 bottom-6 flex justify-center px-4 pointer-events-none">
          <div role="status" aria-live="polite"
            className="inline-flex items-center gap-2.5 rounded-full px-5 h-11 text-[13.5px] font-medium mx-rise"
            style={{ background: C.surface2, color: C.cream, border: `1px solid ${C.lineStrong}`, boxShadow: "0 18px 40px -12px rgba(0,0,0,0.6)" }}>
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: C.green }} />
            {busy === "receipt" ? "Fetching your receipt…" : busy === "pdf" ? "Preparing your tickets…" : "Preparing your ticket…"}
          </div>
        </div>
      )}

      <div className={`mt-8 grid gap-x-8 gap-y-10 justify-items-center ${tickets.length > 1 ? "md:grid-cols-2" : ""}`}>
        {tickets.map((t, i) => (
          <div key={t.ticket_code} className="w-full max-w-[360px] flex flex-col items-center mx-rise" style={{ animationDelay: `${Math.min(i, 4) * 70}ms` }}>
            <PremiumTicket ref={(n) => { refs.current[i] = n; }} ticket={t} total={tickets.length} event={event} order={order} />
            <button onClick={() => savePng(i)} disabled={!!busy}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold h-9 px-4 rounded-full transition hover:brightness-110 disabled:opacity-50"
              style={{ background: C.greenSoft, color: C.green }}>
              {busy === `png-${i}`
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing…</>
                : <><ImageDown className="h-3.5 w-3.5" /> Save ticket</>}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
