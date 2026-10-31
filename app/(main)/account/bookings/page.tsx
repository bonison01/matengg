import type { Metadata } from "next";
import BookingsPage from "@/components/events-api/BookingsPage";

export const metadata: Metadata = { title: "My bookings" };

export default function Page() {
  return <BookingsPage />;
}
