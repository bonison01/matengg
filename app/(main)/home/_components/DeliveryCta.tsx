import { useEffect, useRef, useState } from "react";
import { ArrowRight, Truck } from "lucide-react";
import { DELIVERY_URL } from "../_data/content";

// A road along the lower part of the card, behind the button, so it never runs
// through the heading. It overshoots both edges: the SVG is cropped to the
// card's shape ("slice"), so the road always reaches the sides. The parcel
// rides it on a loop, fading in and out near the ends.
const ROUTE = "M -60 206 C 120 262, 260 150, 400 196 S 660 252, 860 140";

export default function DeliveryCta() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Play the entrance once, when the card first scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="mt-24 px-4 sm:px-6 flex justify-center">
      <style jsx>{`
        .cta-card { opacity: 0; transform: translateY(28px) scale(0.985); transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
        .cta-card.in { opacity: 1; transform: none; }
        .cta-item { opacity: 0; transform: translateY(12px); transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
        .in .cta-item { opacity: 1; transform: none; }
        .in .cta-item:nth-child(2) { transition-delay: 0.08s; }
        .in .cta-item:nth-child(3) { transition-delay: 0.16s; }
        .cta-route { stroke-dasharray: 2 10; animation: cta-dash 18s linear infinite; }
        @keyframes cta-dash { to { stroke-dashoffset: -240; } }
        .cta-btn:hover .cta-arrow { transform: translateX(3px); }
        @media (prefers-reduced-motion: reduce) {
          .cta-card, .cta-item { opacity: 1; transform: none; transition: none; }
          .cta-route { animation: none; }
          .cta-parcel { display: none; }
        }
      `}</style>

      <div
        ref={ref}
        className={`cta-card ${inView ? "in" : ""} relative overflow-hidden rounded-3xl text-center max-w-3xl w-full`}
        style={{
          background: "linear-gradient(135deg, #1b7d14 0%, #14660f 45%, #0d4a0a 100%)",
          boxShadow: "0 0 0 1px rgba(243,241,234,0.08) inset, 0 30px 70px -30px rgba(63,166,55,0.55)",
        }}
      >
        {/* Texture + glow */}
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(rgba(243,241,234,0.09) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          maskImage: "linear-gradient(180deg, #000 0%, transparent 85%)",
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 85%)",
        }} />
        <div aria-hidden className="absolute -top-24 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(232,184,75,0.22), transparent 65%)" }} />

        {/* Delivery route */}
        <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice">
          <path d={ROUTE} fill="none" stroke="rgba(11,20,16,0.28)" strokeWidth="10" strokeLinecap="round" />
          <path d={ROUTE} fill="none" stroke="rgba(243,241,234,0.55)" strokeWidth="2" strokeLinecap="round" className="cta-route" />

          {/* Parcel riding the route */}
          <g className="cta-parcel">
            <g>
              <rect x="-9" y="-9" width="18" height="18" rx="4" fill="#F3F1EA" />
              <path d="M -9 -2 H 9 M 0 -9 V -2" stroke="#14660f" strokeWidth="2" />
              <animateMotion dur="7s" repeatCount="indefinite" path={ROUTE} rotate="auto"
                keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.25 1" />
              <animate attributeName="opacity" dur="7s" repeatCount="indefinite"
                values="0;0;1;1;0;0" keyTimes="0;0.12;0.22;0.8;0.9;1" />
            </g>
          </g>
        </svg>

        <div className="relative z-10 px-6 pt-12 pb-16 sm:px-12 sm:pt-14 sm:pb-20">
          <h2 className="cta-item text-[28px] sm:text-4xl leading-tight text-[#F3F1EA]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            Need something delivered?
          </h2>
          <p className="cta-item text-[15px] text-[#D7E4D8] mt-3">
            Book a fast, reliable local delivery with Mateng.
          </p>
          <div className="cta-item mt-8">
            <a
              href={DELIVERY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn inline-flex items-center gap-2.5 h-12 pl-6 pr-5 rounded-full bg-[#F3F1EA] text-[#0f550c] font-semibold text-[15px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]"
            >
              <Truck className="h-4 w-4" />
              Book Delivery
              <ArrowRight className="cta-arrow h-4 w-4 transition-transform duration-200" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
