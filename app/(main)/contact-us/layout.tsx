// /contact-us — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Contact Mateng — Imphal, Manipur",
  description: "Contact Mateng in Imphal for delivery, cargo, business listing or event ticketing enquiries. Call +91 97747 95905 or send us a message.",
  path: "/contact-us",
  keywords: pageKeywords("/contact-us"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
