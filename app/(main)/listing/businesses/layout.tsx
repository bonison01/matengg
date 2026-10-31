// /listing/businesses — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "List Your Business in Manipur — Free Listing",
  description: "Add your business to Mateng and get discovered by customers across Manipur and Imphal. Free local business listing and promotion.",
  path: "/listing/businesses",
  keywords: pageKeywords("/listing/businesses"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
