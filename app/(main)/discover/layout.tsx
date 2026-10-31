// /discover — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Discover Local Businesses in Manipur & Imphal",
  description: "Discover local businesses in Manipur and Imphal on Mateng — browse shops, services and products from verified local sellers near you.",
  path: "/discover",
  keywords: pageKeywords("/discover"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
