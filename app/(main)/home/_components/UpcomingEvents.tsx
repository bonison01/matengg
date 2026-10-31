import { applyPostponed, type UpcomingEvent } from "../_data/events";
import SectionHeading from "./SectionHeading";
import UpcomingEventCard from "./UpcomingEventCard";

type Props = {
  /** Hand-written events + live ones from the events API (useUpcomingEvents). */
  events: UpcomingEvent[];
  /** API still loading — show a placeholder card after the hand-written ones. */
  loading?: boolean;
  onOpen: () => void;
};

/** Clicking a card opens the shared popup. */
export default function UpcomingEvents({ events, loading, onOpen }: Props) {
  return (
    <section className="px-6 flex flex-col items-center">
      <SectionHeading
        eyebrow="Upcoming Events"
        eyebrowColor="text-[#E8B84B]"
        title="Don't miss what's next"
        className="mb-8"
      />
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {events.map((event) => (
          <UpcomingEventCard key={event.id} event={applyPostponed(event)} onOpen={onOpen} />
        ))}
        {loading && (
          <div aria-hidden className="w-full rounded-2xl overflow-hidden flex flex-col sm:flex-row animate-pulse" style={{ background: "#111812" }}>
            <div className="w-full sm:w-2/5 h-48 sm:h-60" style={{ background: "#16211A" }} />
            <div className="flex-1 px-6 sm:px-8 py-8 space-y-3">
              <div className="h-4 w-40 rounded-full" style={{ background: "#1B281F" }} />
              <div className="h-7 w-3/4 rounded-lg" style={{ background: "#1B281F" }} />
              <div className="h-4 w-full max-w-md rounded" style={{ background: "#16211A" }} />
              <div className="h-4 w-2/3 max-w-sm rounded" style={{ background: "#16211A" }} />
              <div className="h-10 w-36 rounded-full mt-4" style={{ background: "#1B281F" }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}