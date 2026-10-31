// lib/seo/jsonLd.tsx
// ---------------------------------------------------------------------------
// Structured-data builders + the <JsonLd> renderer.
//
// Structured data is what turns a plain blue link into a rich result: star
// ratings on business pages, date/venue/price rows on event pages, the
// knowledge panel for the brand, and the breadcrumb trail above the URL.
// Everything is emitted server-side so crawlers see it in the initial HTML.
// ---------------------------------------------------------------------------

import {
  SITE_URL,
  SITE_NAME,
  LEGAL_NAME,
  GEO,
  SOCIAL_PROFILES,
  CONTACT_PHONE_E164,
  CONTACT_EMAIL,
  absoluteUrl,
} from "./site";

/** Renders a JSON-LD graph into the document. Safe for server components. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped for the one character that can break
      // out of a <script> block.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: GEO.streetAddress,
  addressLocality: GEO.city,
  addressRegion: GEO.state,
  postalCode: GEO.postalCode,
  addressCountry: GEO.country,
};

/** The brand entity. Referenced by @id from every other node. */
export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: LEGAL_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo.png"),
    },
    image: absoluteUrl("/banner.png"),
    description:
      "Mateng is Manipur's local platform for business discovery, hyperlocal delivery and logistics, and online event ticketing — serving Imphal and the wider state.",
    address: ADDRESS,
    areaServed: [
      { "@type": "State", name: "Manipur" },
      { "@type": "City", name: "Imphal" },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: CONTACT_PHONE_E164,
        email: CONTACT_EMAIL,
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["en", "Manipuri", "hi"],
      },
    ],
    sameAs: SOCIAL_PROFILES,
  };
}

/** Enables the sitelinks search box and names the site for the SERP. */
export function webSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description:
      "Discover local businesses in Manipur, book delivery and cargo, and buy event tickets online.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/discover?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * LocalBusiness for the Mateng brand itself — this is the node that makes the
 * company eligible for the Imphal local pack on brand + service searches.
 */
export function localBusinessSchema() {
  return {
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    url: SITE_URL,
    telephone: CONTACT_PHONE_E164,
    email: CONTACT_EMAIL,
    image: absoluteUrl("/banner.png"),
    logo: absoluteUrl("/logo.png"),
    priceRange: "₹₹",
    address: ADDRESS,
    geo: {
      "@type": "GeoCoordinates",
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    areaServed: [
      { "@type": "State", name: "Manipur" },
      { "@type": "City", name: "Imphal" },
    ],
    sameAs: SOCIAL_PROFILES,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
  };
}

/** Breadcrumb trail. `items` is ordered root → current page. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema({
  title,
  description,
  path,
  image,
  publishedTime,
  modifiedTime,
  authorName,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authorName?: string | null;
}) {
  return {
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(path)}#article`,
    headline: title.slice(0, 110),
    description,
    image: image ? [image] : [absoluteUrl("/banner.png")],
    datePublished: publishedTime ?? undefined,
    dateModified: modifiedTime ?? publishedTime ?? undefined,
    author: { "@type": "Person", name: authorName || SITE_NAME },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    inLanguage: "en-IN",
  };
}

export function eventSchema({
  name,
  description,
  path,
  image,
  startDate,
  endDate,
  venueName,
  venueAddress,
  price,
  currency = "INR",
  status = "EventScheduled",
}: {
  name: string;
  description: string;
  path: string;
  image?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  price?: number | null;
  currency?: string;
  status?: "EventScheduled" | "EventPostponed" | "EventCancelled" | "EventRescheduled";
}) {
  return {
    "@type": "Event",
    "@id": `${absoluteUrl(path)}#event`,
    name,
    description,
    url: absoluteUrl(path),
    image: image ? [image] : [absoluteUrl("/banner.png")],
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
    eventStatus: `https://schema.org/${status}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: venueName || GEO.city,
      address: venueAddress
        ? { "@type": "PostalAddress", streetAddress: venueAddress, addressLocality: GEO.city, addressRegion: GEO.state, addressCountry: GEO.country }
        : ADDRESS,
    },
    organizer: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(path),
      price: price ?? 0,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      validFrom: undefined,
    },
  };
}

/** Wraps nodes in the @context envelope Google expects. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
