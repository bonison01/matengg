// /products — SEO metadata
// This route's page is a client component, so its metadata lives here in a
// pass-through layout. The layout adds no markup and changes nothing visually.
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";

export const metadata: Metadata = buildMetadata({
  title: "Local Products from Manipur & Imphal",
  description: "Shop local products from businesses across Manipur and Imphal, discovered and delivered through Mateng.",
  path: "/products",
  keywords: pageKeywords("/products"),
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
