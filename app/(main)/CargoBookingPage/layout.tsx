// /CargoBookingPage — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Book Cargo Online — Imphal to Delhi Cargo Service",
  description: "Book cargo online with Mateng — Imphal to Delhi and Delhi to Imphal cargo, parcel and shipment booking with door to door pickup.",
  path: "/CargoBookingPage",
  keywords: pageKeywords("/CargoBookingPage"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
