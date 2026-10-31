import { PAST_EVENTS } from "../_data/events";
import SectionHeading from "./SectionHeading";
import PastEventCard from "./PastEventCard";

export default function PastEvents() {
  return (
    <section className="mt-24 px-6 flex flex-col items-center">
      <SectionHeading eyebrow="Past Events" title="Successfully concluded" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl w-full">
        {PAST_EVENTS.map((event, i) => (
          <PastEventCard key={event.id} event={event} delay={0.05 * (i + 1)} />
        ))}
      </div>
    </section>
  );
}
