// /light-vehicle — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Light Vehicle Delivery in Imphal & Manipur",
  description: "Book a light vehicle for goods transportation, pickup and drop in Imphal and across Manipur with Mateng Delivery.",
  path: "/light-vehicle",
  keywords: pageKeywords("/light-vehicle"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
