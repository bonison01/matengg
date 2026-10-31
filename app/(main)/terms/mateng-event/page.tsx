import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";
import TicketingTermsPage from "@/components/events-api/TicketingTermsPage";
import { TICKETING_TERMS_PATH } from "@/lib/events/ticketingTerms";

export const metadata: Metadata = buildMetadata({
  title: "Mateng Event Terms & Conditions",
  description: "The terms that apply when you buy event tickets through Mateng, the ticketing partner — refunds, event changes, entry and ticket security.",
  path: TICKETING_TERMS_PATH,
  keywords: pageKeywords("/terms"),
});

export default function Page() {
  return <TicketingTermsPage />;
}
