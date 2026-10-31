// /events/matengfest — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Mateng Edu Fest — Academic Excellence Platform 2026",
  description: "Mateng Edu Fest 2026, Manipur's structured competitive and scholarship platform for students. Registration, admit cards and results.",
  path: "/events/matengfest",
  keywords: pageKeywords("/events/matengfest"),
  image: "/edufest.png",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
