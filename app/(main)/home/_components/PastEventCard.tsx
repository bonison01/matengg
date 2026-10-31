import Link from "next/link";
import Image from "next/image";
import type { PastEvent } from "../_data/events";

type Props = { event: PastEvent; delay: number };

const ConcludedBadge = ({ className = "" }: { className?: string }) => (
  <span className={`concluded-badge eyebrow text-[8px] px-2 py-1 rounded-full text-[#B8C4BA] ${className}`}>
    Concluded
  </span>
);

export default function PastEventCard({ event, delay }: Props) {
  const { image } = event;
  return (
    <div
      className="event-card event-card-past relative rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "#1A1B1D", animationDelay: `${delay}s` }}
    >
      {image && (
        <div className="relative w-full h-20">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover grayscale opacity-60"
            priority={false}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(17,24,18,0.2) 0%, rgba(17,24,18,0.75) 70%, #1A1B1D 100%)",
            }}
          />
          <ConcludedBadge className="absolute top-2 right-2" />
        </div>
      )}

      <div className="px-5 py-5 text-left">
        {image ? (
          <span className="eyebrow text-[8px] text-[#5C6B5E]">{event.dateLabel}</span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <ConcludedBadge />
            <span className="eyebrow text-[8px] text-[#5C6B5E]">{event.dateLabel}</span>
          </div>
        )}

        <h3
          className={`${image ? "mt-1.5" : "mt-2.5"} text-base leading-tight text-[#D7DED9]`}
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          {event.title}
        </h3>

        <p className="mt-2 text-[#7C8A7E] text-xs leading-relaxed line-clamp-2">
          {event.description}
        </p>

        <div className="mt-4">
          <Link href={event.cta.href}>
            <button className="px-4 py-1.5 rounded-full font-semibold text-[#F3F1EA] border border-white/15 hover:border-white/35 hover:bg-white/5 transition-all duration-200 text-xs">
              {event.cta.label}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
