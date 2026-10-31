'use client'

import Footer from "@/components/footer/Footer";
import { fontVariables } from "./_lib/fonts";
import { isHiddenFromPopup } from "./_data/events";
import { useEventModal } from "./_hooks/useEventModal";
import { useUpcomingEvents } from "./_hooks/useUpcomingEvents";
import HomeStyles from "./_components/HomeStyles";
import Hero from "./_components/Hero";
import UpcomingEvents from "./_components/UpcomingEvents";
import WhatWeDo from "./_components/WhatWeDo";
import PastEvents from "./_components/PastEvents";
import Impact from "./_components/Impact";
import DeliveryCta from "./_components/DeliveryCta";
import EventModal from "./_components/EventModal";
import TrustedPartners from "./_components/TrustedPartners";

export default function Page() {
  const modal = useEventModal();
  const upcoming = useUpcomingEvents();

  // Keep postponed events (e.g. Beats of October) out of the page-load popup.
  const popupEvents = upcoming.popup.filter((e) => !isHiddenFromPopup(e));

  return (
    <div
      className={`${fontVariables} w-full min-h-[calc(100svh-64px)] flex flex-col`}
      style={{ background: "#0B1410", fontFamily: "var(--font-body)", color: "#F3F1EA" }}
    >
      <HomeStyles />

      <div className="flex-grow">
        <Hero />
        <UpcomingEvents events={upcoming.events} loading={!upcoming.ready} onOpen={modal.open} />
        <WhatWeDo />
        <PastEvents />
        <Impact />
        <DeliveryCta />
      </div>

      {modal.isOpen && upcoming.ready && popupEvents.length > 0 && (
        <EventModal events={popupEvents} onClose={modal.close} />
      )}

      <TrustedPartners />

      <footer className="w-full mt-20">
        <Footer />
      </footer>
    </div>
  );
}