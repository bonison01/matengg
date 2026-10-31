// /about-us — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "About Mateng — Manipur's Local Platform",
  description: "Mateng connects Manipur — local business discovery, hyperlocal delivery and logistics, and online event ticketing, built and run from Imphal.",
  path: "/about-us",
  keywords: pageKeywords("/about-us"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
