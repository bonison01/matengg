// lib/seo/site.ts
// ---------------------------------------------------------------------------
// Single source of truth for everything SEO. Every page's <title>, description,
// canonical URL, Open Graph card and JSON-LD block is derived from here, so the
// site can never drift into the "every page says 'Mateng — Explore with Mateng'"
// state it was in before.
// ---------------------------------------------------------------------------

/** Canonical host. Non-www; `www.` 301s here (see next.config.ts redirects). */
export const SITE_URL = "https://justmateng.com";

export const SITE_NAME = "Mateng";

/** Legal / brand name used in Organization structured data. */
export const LEGAL_NAME = "Mateng";

export const CONTACT_PHONE = "+91 97747 95905";
export const CONTACT_PHONE_E164 = "+919774795905";
export const CONTACT_EMAIL = "support@justmateng.com";

/**
 * Primary service area. Google uses areaServed on LocalBusiness/Service to
 * decide which local packs a business is eligible for, so both the state and
 * the city are named explicitly rather than relying on the address alone.
 */
export const GEO = {
  city: "Imphal",
  state: "Manipur",
  region: "IN-MN",
  country: "IN",
  postalCode: "795001",
  streetAddress: "Imphal",
  latitude: 24.817,
  longitude: 93.9368,
} as const;

export const SOCIAL_PROFILES = [
  "https://www.instagram.com/mateng.discovery/",
  "https://www.instagram.com/mateng.delivery/",
  "https://www.facebook.com/justmateng",
];

/** Absolute URL helper — canonicals and JSON-LD must never be relative. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Default social share image. */
export const DEFAULT_OG_IMAGE = {
  url: absoluteUrl("/banner.png"),
  width: 1200,
  height: 630,
  alt: "Mateng — business discovery, delivery and event ticketing in Manipur",
};

type BuildMetaInput = {
  title: string;
  description: string;
  /** Site-relative path, e.g. "/events". Used for the canonical tag. */
  path: string;
  keywords?: string[];
  image?: string;
  /** Set false for thin/utility pages that should stay out of the index. */
  index?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Builds a complete Next.js Metadata object: canonical, Open Graph, Twitter
 * card and robots directives. Pages should call this rather than hand-rolling
 * metadata, so no page ships without a canonical again.
 */
export function buildMetadata({
  title,
  description,
  path,
  keywords,
  image,
  index = true,
  type = "website",
  publishedTime,
  modifiedTime,
}: BuildMetaInput) {
  const url = absoluteUrl(path);
  const ogImage = image
    ? { url: /^https?:\/\//i.test(image) ? image : absoluteUrl(image), width: 1200, height: 630, alt: title }
    : DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true, "max-image-preview": "large" as const, "max-snippet": -1, "max-video-preview": -1 }
      : { index: false, follow: false },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "en_IN",
      images: [ogImage],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [ogImage.url],
    },
  };
}
