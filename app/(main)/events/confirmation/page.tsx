// Payment return page for events from the centralized events API. Set each
// event's Confirmation URL (admin → Settings) to https://justmateng.com/events/confirmation
import { Suspense } from "react";
import type { Metadata } from "next";
import ConfirmationPage from "@/components/events-api/ConfirmationPage";

export const metadata: Metadata = { title: "Booking confirmation", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConfirmationPage />
    </Suspense>
  );
}
