import Link from "next/link";
import { DELIVERY_URL } from "../_data/content";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center text-center px-6 pt-28 pb-20 overflow-hidden">
      <svg
        className="absolute inset-x-0 top-10 w-full max-w-4xl mx-auto opacity-40 pointer-events-none"
        viewBox="0 0 800 160"
        fill="none"
      >
        <path
          d="M20 120 C 180 20, 280 140, 420 60 S 640 20, 780 90"
          stroke="#3FA637"
          strokeWidth="1.5"
          className="route-line"
        />
        <circle cx="20" cy="120" r="4" fill="#E8B84B" />
        <circle cx="420" cy="60" r="4" fill="#3FA637" />
        <circle cx="780" cy="90" r="4" fill="#E8B84B" />
      </svg>

      <span className="eyebrow relative text-[11px] text-[#8FA391] mb-6">
        All Across India — On the Move
      </span>

      <h1
        className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] max-w-4xl"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "#F3F1EA" }}
      >
        Discover, Events & Delivery — Making a{" "}
        <em style={{ fontStyle: "italic", color: "#3FA637" }}>Difference</em>.
      </h1>

      <p className="relative text-[#92A395] mt-6 max-w-xl text-sm sm:text-base leading-relaxed">
        Mateng delivers parcels all across India, helps people discover great local
        businesses, and creates events that unite people — building community, joy, and
        healthy competition along the way.
      </p>

      <div className="relative flex flex-col sm:flex-row gap-4 mt-10">
        <Link href="/events">
          <button
            className="px-8 py-3 rounded-full font-semibold text-[#0B1410] transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "#3FA637" }}
          >
            Explore Events →
          </button>
        </Link>
        <Link href={DELIVERY_URL}>
          <button
            className="px-8 py-3 rounded-full font-semibold text-[#F3F1EA] border transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3FA637]/60"
            style={{ borderColor: "rgba(243,241,234,0.18)" }}
          >
            Book Delivery →
          </button>
        </Link>
      </div>
    </section>
  );
}
