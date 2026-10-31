// /businesses — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Local Businesses in Imphal & Manipur",
  description: "Find local businesses in Imphal and across Manipur by category — retail, restaurants, healthcare, beauty, education, fitness and more.",
  path: "/businesses",
  keywords: pageKeywords("/businesses"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
