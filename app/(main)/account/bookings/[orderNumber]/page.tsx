import type { Metadata } from "next";
import TicketsPage from "@/components/events-api/TicketsPage";

export const metadata: Metadata = { title: "Your tickets" };

export default async function Page({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <TicketsPage orderNumber={decodeURIComponent(orderNumber)} />;
}
