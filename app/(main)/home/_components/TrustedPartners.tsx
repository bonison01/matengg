'use client'

import { useRef } from "react";
import { PARTNERS } from "../_data/content";

const NAV_BTN =
  "absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-[#F3F1EA] transition-all duration-200 shadow-lg backdrop-blur-sm";
const NAV_STYLE = { background: "rgba(243,241,234,0.08)", border: "1px solid rgba(243,241,234,0.16)" };

export default function TrustedPartners() {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = (left: number) => trackRef.current?.scrollBy({ left, behavior: "smooth" });

  return (
    <section className="mt-28 px-6 flex flex-col items-center">
      <div className="text-center mb-12">
        <span className="eyebrow text-[11px] text-[#E8B84B] mb-3 block">Our Network</span>
        <h2 className="text-2xl sm:text-3xl mb-3" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
          Trusted Partners
        </h2>
        <p className="text-[#92A395] text-sm max-w-md mx-auto">
          Proudly working with 400+ local businesses across Imphal and Delhi
        </p>
      </div>

      <div className="relative w-full max-w-5xl">
        <button onClick={() => scroll(-200)} aria-label="Scroll partners left" className={`${NAV_BTN} left-0 -translate-x-1/2`} style={NAV_STYLE}>
          ‹
        </button>
        <button onClick={() => scroll(200)} aria-label="Scroll partners right" className={`${NAV_BTN} right-0 translate-x-1/2`} style={NAV_STYLE}>
          ›
        </button>

        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0B1410] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0B1410] to-transparent z-10 pointer-events-none" />

        <div ref={trackRef} className="partner-track flex gap-5 overflow-x-auto scroll-smooth px-8 pb-2">
          {[...PARTNERS, ...PARTNERS].map((partner, i) => (
            <div
              key={i}
              className="flex-shrink-0 group relative w-40 h-24 rounded-2xl flex flex-col items-center justify-center px-5 gap-2 transition-all duration-300 cursor-pointer"
              style={{ background: "rgba(243,241,234,0.04)", border: "1px dashed rgba(243,241,234,0.14)" }}
            >
              <div
                className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{ background: "#3FA637" }}
              />
              <img
                src={partner.logo}
                alt={partner.name}
                className="max-h-10 max-w-[75%] object-contain opacity-50 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all duration-300"
              />
              <span className="eyebrow text-[10px] text-[#8FA391] group-hover:text-[#F3F1EA] truncate w-full text-center transition-all duration-300">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
