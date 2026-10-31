// /privacy_policy — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How Mateng collects, uses and protects your personal data across discovery, delivery and event ticketing services.",
  path: "/privacy_policy",
  keywords: pageKeywords("/privacy_policy"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
