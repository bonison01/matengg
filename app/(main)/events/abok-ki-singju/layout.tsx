// /events/abok-ki-singju — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Abok Ki Singju — Film Screening Tickets, Imphal",
  description: "Abok Ki Singju, a student awareness film by NaoTon presented by Cicada Film Production — 4 October 2026 at M.S.F.D.S. Tickets ₹200.",
  path: "/events/abok-ki-singju",
  keywords: pageKeywords("/events/abok-ki-singju"),
  image: "/abok-ki-singju.jpeg",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
