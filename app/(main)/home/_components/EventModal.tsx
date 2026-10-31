'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { STATUS_LABEL, type UpcomingEvent } from "../_data/events";
import EventCta from "./EventCta";

type Props = { events: UpcomingEvent[]; onClose: () => void };

/** Auto-advance delay in ms. Set to 0 to turn autoplay off. */
const AUTOPLAY_MS = 6000;
/** Horizontal drag distance (px) that counts as a swipe. */
const SWIPE_PX = 50;

const controlStyle = {
  background: "rgba(11,20,16,0.7)",
  border: "1px solid rgba(243,241,234,0.16)",
};

/** Popup showing upcoming events as slides, one at a time. */
export default function EventModal({ events, onClose }: Props) {
  const count = events.length;
  const multi = count > 1;

  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [userNavigated, setUserNavigated] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // The popup list can change length while it's open (API events load in).
  const current = Math.min(index, Math.max(count - 1, 0));

  const goTo = useCallback(
    (next: number) => {
      if (count < 2) return;
      setIndex(((next % count) + count) % count);
      setUserNavigated(true); // stop autoplay once the visitor takes control
    },
    [count]
  );

  // Autoplay: pauses while hovering/focused, stops for good after manual navigation.
  useEffect(() => {
    if (!multi || !AUTOPLAY_MS || hovered || userNavigated) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [multi, hovered, userNavigated, index, count]);

  // Keyboard: ← → to move, Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (multi && e.key === "ArrowRight") goTo(current + 1);
      else if (multi && e.key === "ArrowLeft") goTo(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [multi, current, goTo, onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_PX) return;
    goTo(current + (dx < 0 ? 1 : -1));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6"
      style={{
        background: "rgba(11,20,16,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Upcoming events"
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl border border-dashed overflow-hidden animate-[pop-in_0.35s_cubic-bezier(0.22,1,0.36,1)_both] max-h-[85vh] overflow-y-auto"
        style={{ background: "#101B15", borderColor: "rgba(243,241,234,0.2)" }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center text-[#F3F1EA] text-base"
          style={controlStyle}
        >
          ×
        </button>

        {multi && (
          <>
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label="Previous event"
              className="absolute left-3 top-28 sm:top-36 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center text-[#F3F1EA] text-lg transition-transform active:scale-90"
              style={controlStyle}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="Next event"
              className="absolute right-3 top-28 sm:top-36 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center text-[#F3F1EA] text-lg transition-transform active:scale-90"
              style={controlStyle}
            >
              ›
            </button>
          </>
        )}

        {/* Slide viewport */}
        <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {events.map((event, i) => (
              <article
                key={event.id}
                className="flex flex-col w-full shrink-0"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={i !== current}
                inert={i !== current}
              >
                <div className="relative w-full h-56 sm:h-72">
                  {event.image ? (
                    <Image
                      src={event.image}
                      alt={event.imageAlt}
                      fill
                      sizes="(min-width: 640px) 448px, 100vw"
                      className="object-cover object-top"
                      priority={i === 0}
                    />
                  ) : (
                    // API event without a poster yet
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background:
                          "radial-gradient(120% 90% at 80% 0%, rgba(63,166,55,0.28), transparent 60%), radial-gradient(90% 80% at 0% 100%, rgba(232,184,75,0.16), transparent 60%), #0E1913",
                      }}
                    >
                      <span
                        className="text-2xl px-6 text-center text-[#F3F1EA]/80"
                        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                      >
                        {event.title}
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(16,27,21,0) 40%, rgba(16,27,21,0.92) 100%)",
                    }}
                  />
                </div>

                <div className="px-5 pb-6 pt-4 sm:px-7 sm:pb-7 text-left flex flex-col flex-1">
                  <span className="eyebrow text-[9px] sm:text-[10px] text-[#E8B84B]">
                    {STATUS_LABEL[event.status]} · {event.badgeDate}
                  </span>
                  <h3
                    className="text-lg sm:text-xl mt-2 text-[#F3F1EA] leading-snug"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                  >
                    {event.title}
                  </h3>
                  <p className="text-[#92A395] mt-2.5 sm:mt-3 text-[13px] sm:text-sm leading-relaxed">
                    {event.modalDescription}
                  </p>
                  <div className="mt-auto pt-5 sm:pt-6">
                    <EventCta cta={event.cta} variant="modal" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Dots */}
        {multi && (
          <div className="flex items-center justify-center gap-2 pb-5 sm:pb-6">
            {events.map((event, i) => (
              <button
                key={event.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to event ${i + 1}: ${event.title}`}
                aria-current={i === current}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 24 : 8,
                  background: i === current ? "#3FA637" : "rgba(243,241,234,0.25)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}