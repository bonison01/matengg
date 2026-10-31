// "Trouble with a booking?" banner that opens a WhatsApp chat with the Mateng
// ticketing helpline, with a message pre-filled from the page (event name or
// order number) so support knows what it's about.

import React from "react";
import { ArrowUpRight } from "lucide-react";

export const BOOKING_HELP_WHATSAPP = "+91 6009-861266";
const WA_NUMBER = "916009861266"; // wa.me wants digits only, with country code

export function bookingHelpUrl(message = "Hi Mateng, I need help with a ticket booking.") {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

function WhatsAppGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

const THEMES = {
  dark: {
    card: { background: "linear-gradient(135deg, rgba(37,211,102,0.10), rgba(16,27,21,0.9) 55%)", border: "1px solid rgba(37,211,102,0.28)" },
    title: "#F3F1EA",
    text: "#92A395",
    number: "#F3F1EA",
  },
  light: {
    card: { background: "linear-gradient(135deg, #ecfdf3, #ffffff 60%)", border: "1px solid #bbf7d0" },
    title: "#0B1410",
    text: "#5B6B5D",
    number: "#0B1410",
  },
};

export default function BookingHelpCta({
  theme = "dark",
  message,
  className = "",
}: {
  theme?: "dark" | "light";
  /** Pre-filled WhatsApp message, e.g. with the event name or order number. */
  message?: string;
  className?: string;
}) {
  const T = THEMES[theme];
  return (
    <aside
      className={`w-full rounded-2xl px-5 py-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 ${className}`}
      style={T.card}
      aria-label="Help with ticket booking"
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white"
          style={{ background: "#25D366", boxShadow: "0 8px 24px -8px rgba(37,211,102,0.7)" }}>
          <WhatsAppGlyph className="w-6 h-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[16px] sm:text-[17px] font-semibold leading-snug" style={{ color: T.title }}>
            Any issue with your ticket booking?
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: T.text }}>
            Payment done but no tickets, trouble logging in, or anything else — message our ticketing team on WhatsApp at{" "}
            <span className="font-semibold whitespace-nowrap" style={{ color: T.number }}>{BOOKING_HELP_WHATSAPP}</span>.
          </p>
        </div>
      </div>
      <a
        href={bookingHelpUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        className="group shrink-0 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-[14.5px] font-semibold text-[#0B1410] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98]"
        style={{ background: "#25D366", boxShadow: "0 10px 24px -12px rgba(37,211,102,0.9)" }}
      >
        <WhatsAppGlyph className="w-4.5 h-4.5" />
        Chat on WhatsApp
        <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </aside>
  );
}
