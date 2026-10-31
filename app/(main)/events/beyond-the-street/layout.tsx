// /events/beyond-the-street — SEO metadata
// Pass-through layout that carries the route's metadata. It adds no markup.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Beyond the Street — Dancesport Battle, Imphal",
  description: "Beyond the Street Dancesport Battle on 4 October 2026 at Thangmeiband Cheiraoching, Imphal West. Breaking & Hip Hop 7 to Smoke (Open), Breaking and All Style 1v1 (Junior). Call 8787649928 to register.",
  path: "/events/beyond-the-street",
  keywords: pageKeywords("/events/beyond-the-street"),
  image: "/beyond-the-street.jpeg",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}