// /events/summer-sound — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Summer of Sound Live Concert 2026 — Tickets",
  description: "Summer of Sound Live Concert 2026 at Chumthang, Shannapung Langthabal on 26 September 2026, 5:00 PM. Book concert tickets online with Mateng.",
  path: "/events/summer-sound",
  keywords: pageKeywords("/events/summer-sound"),
  image: "/summer.png",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
