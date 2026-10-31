// /delivery-rates — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Delivery Rates in Manipur & Imphal",
  description: "Mateng delivery and logistics rates for Imphal and Manipur — bike, light vehicle and cargo pricing for businesses and individuals.",
  path: "/delivery-rates",
  keywords: pageKeywords("/delivery-rates"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
