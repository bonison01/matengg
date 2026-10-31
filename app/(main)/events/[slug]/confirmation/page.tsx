// Same confirmation page, for events whose Confirmation URL is set per event
// (e.g. https://justmateng.com/events/<slug>/confirmation).
import { Suspense } from "react";
import type { Metadata } from "next";
import ConfirmationPage from "@/components/events-api/ConfirmationPage";

export const metadata: Metadata = { title: "Booking confirmation", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={null}>
      <ConfirmationPage slug={slug} />
    </Suspense>
  );
}
