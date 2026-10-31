// /terms — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Terms & Conditions",
  description: "The terms governing your use of Mateng's business discovery, delivery, logistics and event ticketing services.",
  path: "/terms",
  keywords: pageKeywords("/terms"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
