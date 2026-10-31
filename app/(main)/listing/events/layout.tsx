// /listing/events — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "List Your Event in Manipur — Sell Tickets Online",
  description: "Publish your event on Mateng and sell tickets online to audiences across Manipur and Imphal. Built for local event organisers.",
  path: "/listing/events",
  keywords: pageKeywords("/listing/events"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
