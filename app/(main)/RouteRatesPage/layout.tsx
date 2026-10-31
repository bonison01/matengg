// /RouteRatesPage — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Cargo Route Rates — Imphal, Delhi & Manipur",
  description: "Check Mateng cargo and parcel rates by route, including Imphal to Delhi and Delhi to Imphal shipping charges.",
  path: "/RouteRatesPage",
  keywords: pageKeywords("/RouteRatesPage"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
