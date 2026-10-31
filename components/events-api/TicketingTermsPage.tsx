"use client";
// /terms/mateng-event — Terms & Conditions for tickets bought through Mateng.

import React from "react";
import Link from "next/link";
import {
  TICKETING_TERMS,
  TICKETING_TERMS_CONTACT,
  TICKETING_TERMS_INTRO,
} from "@/lib/events/ticketingTerms";
import { C, Shell } from "./ui";

export default function TicketingTermsPage() {
  return (
    <Shell>
      <article className="max-w-3xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16">
        <span className="mx-eyebrow text-[11px]" style={{ color: C.green }}>Mateng Events</span>
        <h1 className="mx-display text-4xl sm:text-5xl mt-3 leading-[1.05]">Mateng Event Terms &amp; Conditions</h1>
        <p className="mt-5 text-[15px] leading-relaxed" style={{ color: C.muted }}>{TICKETING_TERMS_INTRO}</p>

        <ol className="mt-10 space-y-3">
          {TICKETING_TERMS.map((t, i) => (
            <li key={t.title} id={`term-${i + 1}`} className="mx-card px-5 sm:px-6 py-5 scroll-mt-24">
              <h2 className="flex items-baseline gap-3 text-[17px] font-semibold">
                <span className="mx-tabular text-[12px]" style={{ color: C.green }}>{String(i + 1).padStart(2, "0")}</span>
                {t.title}
              </h2>
              <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>{t.body}</p>
              {t.list && (
                <ul className="mt-2.5 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[14px]" style={{ color: C.muted }}>
                  {t.list.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-[9px] h-1 w-1 rounded-full shrink-0" style={{ background: C.green }} />
                      <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl px-5 sm:px-6 py-5" style={{ background: C.greenSoft, border: `1px solid ${C.green}40` }}>
          <p className="text-[14.5px] leading-relaxed" style={{ color: C.cream }}>{TICKETING_TERMS_CONTACT}</p>
        </div>

        <p className="mt-8 text-[13px]" style={{ color: C.muted2 }}>
          Mateng Events | Ticketing Partner · See also our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-[#3FA637]">Terms of Use</Link> and{" "}
          <Link href="/privacy_policy" className="underline underline-offset-4 hover:text-[#3FA637]">Privacy Policy</Link>.
        </p>
      </article>
    </Shell>
  );
}
