// /blog — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Journal — Business, Delivery & Events in Manipur",
  description: "Guides on promoting and growing a business in Manipur, plus delivery, logistics and event news from Imphal — the Mateng Journal.",
  path: "/blog",
  keywords: pageKeywords("/blog"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
