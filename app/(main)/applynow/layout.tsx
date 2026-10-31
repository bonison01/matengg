// /applynow — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Careers at Mateng — Jobs in Imphal, Manipur",
  description: "Join the Mateng team in Imphal, Manipur. See current openings across delivery, operations, technology and events, and apply online.",
  path: "/applynow",
  keywords: pageKeywords("/applynow"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
