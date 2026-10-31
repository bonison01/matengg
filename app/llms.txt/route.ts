// app/llms.txt/route.ts — served at /llms.txt
// An emerging convention (not yet used by Google) that gives AI crawlers and
// assistants a curated, plain-text map of the site instead of leaving them to
// infer it from rendered HTML. Cheap to maintain and safe: it lists only
// public pages, exactly like the sitemap.
import { SITE_URL, CONTACT_PHONE, CONTACT_EMAIL } from "@/lib/seo/site";

export const revalidate = 86400;

const BODY = `# Mateng

> Mateng is a local platform based in Imphal, Manipur, India. It operates three
> services: business discovery (a directory of local businesses, products and
> places), delivery and logistics (hyperlocal and same-day delivery plus
> Imphal-Delhi cargo), and event ticketing (online ticket sales and
> registration for concerts, festivals and events).

Service area: Imphal and the state of Manipur, India. Cargo additionally runs
between Imphal and Delhi in both directions.

Contact: ${CONTACT_PHONE} · ${CONTACT_EMAIL}

## Discovery
- [Discover local businesses](${SITE_URL}/discover): Directory of local businesses in Manipur and Imphal.
- [Business directory](${SITE_URL}/businesses): Businesses by category across Manipur.
- [List your business](${SITE_URL}/listing/businesses): Free business listing submission.
- [Local products](${SITE_URL}/products): Products from businesses in Manipur.

## Delivery and logistics
- [Delivery rates](${SITE_URL}/delivery-rates): Current pricing by vehicle type.
- [Light vehicle booking](${SITE_URL}/light-vehicle): Goods transportation and bulk movement.

## Cargo
- [Book cargo](${SITE_URL}/CargoBookingPage): Cargo booking form.
- [Route rates](${SITE_URL}/RouteRatesPage): Rates by route.

## Events
- [Events in Manipur](${SITE_URL}/events): Upcoming events, concerts and festivals.
- [List your event](${SITE_URL}/listing/events): Publish an event and sell tickets.

## Company
- [About Mateng](${SITE_URL}/about-us)
- [Contact](${SITE_URL}/contact-us)
- [Journal](${SITE_URL}/blog): Articles on business, delivery and events in Manipur.
- [Careers](${SITE_URL}/applynow)

## Optional
- [Privacy policy](${SITE_URL}/privacy_policy)
- [Terms and conditions](${SITE_URL}/terms)
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
