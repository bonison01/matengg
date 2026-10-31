// /events — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Events in Manipur & Imphal — Book Tickets Online",
  description: "Discover upcoming events, concerts and festivals in Manipur and Imphal, and buy event tickets online with Mateng.",
  path: "/events",
  keywords: pageKeywords("/events"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
