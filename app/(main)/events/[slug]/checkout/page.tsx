import type { Metadata } from "next";
import CheckoutPage from "@/components/events-api/CheckoutPage";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CheckoutPage slug={slug} />;
}
