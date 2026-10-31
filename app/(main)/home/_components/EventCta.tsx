import Link from "next/link";
import type { UpcomingEvent } from "../_data/events";

type Props = {
  cta: UpcomingEvent["cta"];
  /** "card" = compact pill, "modal" = full-width button */
  variant: "card" | "modal";
};

export default function EventCta({ cta, variant }: Props) {
  const isModal = variant === "modal";
  const size = isModal ? "w-full px-6 py-3 active:scale-[0.98]" : "px-6 py-2.5 hover:-translate-y-0.5";
  const base = `${size} rounded-full font-semibold text-[#0B1410] transition-all duration-200 text-sm`;
  const style = { background: "#3FA637" };

  if (cta.type === "soon") {
    return (
      <button
        type="button"
        disabled
        onClick={(e) => e.stopPropagation()}
        className={`tickets-soon-btn ${isModal ? "block w-full" : ""} ${size} rounded-full font-semibold text-[#0B1410] text-sm`}
        style={style}
      >
        {cta.label}
      </button>
    );
  }

  return (
    <Link href={cta.href} className={isModal ? "block" : undefined}>
      <button type="button" onClick={(e) => e.stopPropagation()} className={base} style={style}>
        {cta.label}
      </button>
    </Link>
  );
}
