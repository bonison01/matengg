import Image from "next/image";
import { STATUS_LABEL, type UpcomingEvent } from "../_data/events";
import EventCta from "./EventCta";

type Props = { event: UpcomingEvent; onOpen: () => void };

export default function UpcomingEventCard({ event, onOpen }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      className="w-full cursor-pointer"
    >
      <div
        className="event-card event-card-upcoming relative rounded-2xl overflow-hidden flex flex-col sm:flex-row"
        style={{ background: "#111812" }}
      >
        <div className="relative w-full sm:w-2/5 h-48 sm:h-auto">
          {event.image ? (
            <Image src={event.image} alt={event.imageAlt} fill sizes="(min-width: 640px) 360px, 100vw" className="object-cover" priority />
          ) : (
            // API event without a poster yet
            <div className="absolute inset-0 flex items-center justify-center px-6" style={{ background: "radial-gradient(120% 90% at 80% 0%, rgba(63,166,55,0.28), transparent 60%), radial-gradient(90% 80% at 0% 100%, rgba(232,184,75,0.16), transparent 60%), #0E1913" }}>
              <span className="text-2xl text-center text-[#F3F1EA]/80" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{event.title}</span>
            </div>
          )}
          <div
            className="absolute inset-0 sm:hidden"
            style={{
              background: "linear-gradient(180deg, rgba(17,24,18,0) 40%, rgba(17,24,18,0.85) 100%)",
            }}
          />
        </div>

        <div className="flex-1 px-6 sm:px-8 py-6 sm:py-8 text-left flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="eyebrow text-[9px] px-2.5 py-1 rounded-full text-[#0B1410] font-semibold"
              style={{ background: "#3FA637" }}
            >
              <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#0B1410] mr-1.5 align-middle" />
              {STATUS_LABEL[event.status]}
            </span>
            <span className="eyebrow text-[9px] text-[#8FA391]">{event.badgeDate}</span>
          </div>

          <h3
            className="mt-3 text-2xl sm:text-3xl leading-tight text-[#F3F1EA]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            {event.title}
          </h3>

          <p className="mt-3 text-[#92A395] text-sm leading-relaxed max-w-md">
            {event.description}
          </p>

          <div className="mt-6">
            <EventCta cta={event.cta} variant="card" />
          </div>
        </div>
      </div>
    </div>
  );
}
