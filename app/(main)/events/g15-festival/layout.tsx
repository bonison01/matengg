// /events/g15-festival — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "G15 Festival 2026, Manipur",
  description: "G15 Festival 2026 in Manipur — highlights, lineup and gallery from the festival, hosted on Mateng Events.",
  path: "/events/g15-festival",
  keywords: pageKeywords("/events/g15-festival"),
  image: "/g15-festival.png",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
