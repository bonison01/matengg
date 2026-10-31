// app/(main)/businesses/[slug]/page.tsx
// ---------------------------------------------------------------------------
// Individual business page.
//
// Until now the directory was a single route with modal detail views, so no
// business on the platform had a URL of its own — which meant none of them
// could be indexed, and the site could not rank for a business name or for
// "<category> in Imphal". This is the page that makes each listing a real,
// crawlable destination with its own LocalBusiness structured data.
// ---------------------------------------------------------------------------
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/footer/Footer";
import { supabase } from "@/lib/supabaseClient";
import { findBySlug, entitySlug } from "@/lib/seo/slug";
import { buildMetadata, GEO, absoluteUrl, SITE_URL } from "@/lib/seo/site";
import { JsonLd, graph, breadcrumbSchema } from "@/lib/seo/jsonLd";
import type { DBBusiness } from "../BusinessesClient";

export const revalidate = 1800;

const TEXT = "#0B1410";
const MUTED = "#5B6B5D";
const GREEN = "#3FA637";
const GREEN_DARK = "#0F550C";
const CARD_BG = "#F6F7F4";
const CARD_BORDER = "#E1E5DE";

async function getBusiness(slug: string): Promise<DBBusiness | null> {
  const { data } = await supabase.from("businesses_full").select("*").eq("verified", true);
  return findBySlug((data ?? []) as DBBusiness[], slug);
}

function describe(b: DBBusiness): string {
  const where = [b.city || GEO.city, b.state || GEO.state].filter(Boolean).join(", ");
  const base =
    b.tagline?.trim() ||
    b.description?.replace(/\s+/g, " ").trim() ||
    `${b.name} in ${where}.`;
  return `${base} ${b.services?.length ? `Services: ${b.services.slice(0, 4).join(", ")}. ` : ""}Contact details, hours and reviews on Mateng.`
    .replace(/\s+/g, " ")
    .slice(0, 158);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBusiness(slug);

  if (!b) {
    return buildMetadata({
      title: "Business not found",
      description: "This business listing is no longer available on Mateng.",
      path: `/businesses/${slug}`,
      index: false,
    });
  }

  const where = b.city || GEO.city;
  return buildMetadata({
    title: `${b.name} — ${where}, ${b.state || GEO.state}`,
    description: describe(b),
    path: `/businesses/${entitySlug(b.name, b.id)}`,
    image: b.cover_photo_url || b.photos?.[0]?.url || undefined,
    keywords: [
      b.name,
      `${b.name} ${where}`,
      `${b.category} in ${where}`,
      `businesses in ${where}`,
      "local businesses in Manipur",
    ],
  });
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBusiness(slug);
  if (!b) notFound();

  const path = `/businesses/${entitySlug(b.name, b.id)}`;
  const where = [b.address, b.city || GEO.city, b.state || GEO.state].filter(Boolean).join(", ");
  const cover = b.cover_photo_url || b.photos?.find((p) => p.is_cover)?.url || b.photos?.[0]?.url;

  const openingHours = (b.hours ?? [])
    .filter((h) => !h.is_closed && h.open_time && h.close_time)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.day,
      opens: h.open_time,
      closes: h.close_time,
    }));

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "LocalBusiness",
            "@id": `${absoluteUrl(path)}#business`,
            name: b.name,
            url: absoluteUrl(path),
            description: b.description || b.tagline || undefined,
            image: cover ? [cover] : undefined,
            telephone: b.phone || undefined,
            email: b.email || undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: b.address || undefined,
              addressLocality: b.city || GEO.city,
              addressRegion: b.state || GEO.state,
              addressCountry: GEO.country,
            },
            ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
            // A rating is only emitted when there is a real one with a real
            // review count — inventing either is a structured-data violation
            // and risks a manual action.
            ...(b.rating && b.review_count
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: b.rating,
                    reviewCount: b.review_count,
                    bestRating: 5,
                  },
                }
              : {}),
            ...(b.services?.length
              ? {
                  hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: `${b.name} services`,
                    itemListElement: b.services.map((s) => ({
                      "@type": "Offer",
                      itemOffered: { "@type": "Service", name: s },
                    })),
                  },
                }
              : {}),
            sameAs: [b.website, b.instagram, b.facebook].filter(Boolean),
            isPartOf: { "@id": `${SITE_URL}/#website` },
          },
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Businesses", path: "/businesses" },
            { name: b.name, path },
          ])
        )}
      />

      <div
        // relative/z-index: the root layout paints an absolutely-positioned
        // .bg-overlay across the full document, which would otherwise cover
        // this statically-positioned content below the fold.
        style={{ background: "#FFFFFF", color: TEXT, position: "relative", zIndex: 1 }}
        className="w-full min-h-screen"
      >
        <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-10 pb-4">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[13px]" style={{ color: MUTED }}>
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/businesses" className="hover:underline">Businesses</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{b.name}</li>
            </ol>
          </nav>

          {b.category && (
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-4" style={{ color: GREEN_DARK }}>
              {b.category}
              {b.verified ? " · Verified" : ""}
            </p>
          )}

          <h1
            className="text-3xl sm:text-4xl md:text-5xl leading-[1.12] font-semibold"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {b.name}
          </h1>

          {b.tagline && (
            <p className="mt-4 text-[17px] leading-[1.7]" style={{ color: MUTED }}>{b.tagline}</p>
          )}

          <p className="mt-3 text-[15px]" style={{ color: MUTED }}>{where}</p>

          {typeof b.rating === "number" && b.rating > 0 && (
            <p className="mt-2 text-[15px]" style={{ color: MUTED }}>
              ★ {b.rating.toFixed(1)}
              {b.review_count ? ` · ${b.review_count} review${b.review_count === 1 ? "" : "s"}` : ""}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {b.phone && (
              <a href={`tel:${b.phone}`} className="px-6 py-3 rounded-full font-semibold text-white" style={{ background: GREEN }}>
                Call {b.phone}
              </a>
            )}
            {b.maps_url && (
              <a href={b.maps_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-full font-semibold border" style={{ borderColor: CARD_BORDER, color: TEXT }}>
                Directions
              </a>
            )}
            {b.website && (
              <a href={b.website} target="_blank" rel="noopener noreferrer nofollow" className="px-5 py-3 font-semibold hover:underline" style={{ color: GREEN_DARK }}>
                Website
              </a>
            )}
          </div>
        </div>

        {cover && (
          <div className="max-w-3xl mx-auto px-5 sm:px-6 mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={`${b.name} — ${b.category} in ${b.city || GEO.city}, ${b.state || GEO.state}`}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full rounded-2xl object-cover"
              style={{ maxHeight: 420 }}
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-8">
          {b.description && (
            <section className="mt-8">
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                About {b.name}
              </h2>
              <p className="mt-4 text-[16px] leading-[1.75] whitespace-pre-line" style={{ color: MUTED }}>
                {b.description}
              </p>
            </section>
          )}

          {b.services?.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                Services
              </h2>
              <ul className="mt-5 space-y-2.5">
                {b.services.map((s) => (
                  <li key={s} className="flex gap-3 text-[16px]" style={{ color: MUTED }}>
                    <span aria-hidden="true" style={{ color: GREEN }} className="font-bold">—</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {b.hours?.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                Opening hours
              </h2>
              <dl className="mt-5 rounded-2xl overflow-hidden" style={{ border: `1px solid ${CARD_BORDER}` }}>
                {b.hours.map((h, i) => (
                  <div
                    key={h.day}
                    className="flex justify-between px-5 py-3 text-[15px]"
                    style={{ background: i % 2 ? CARD_BG : "transparent", color: MUTED }}
                  >
                    <dt className="font-medium">{h.day}</dt>
                    <dd>{h.is_closed ? "Closed" : `${h.open_time} – ${h.close_time}`}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
              Contact
            </h2>
            <ul className="mt-5 space-y-2.5 text-[16px]" style={{ color: MUTED }}>
              <li>{where}</li>
              {b.phone && <li>Phone: <a href={`tel:${b.phone}`} className="hover:underline" style={{ color: GREEN_DARK }}>{b.phone}</a></li>}
              {b.email && <li>Email: <a href={`mailto:${b.email}`} className="hover:underline" style={{ color: GREEN_DARK }}>{b.email}</a></li>}
              {b.owner_name && <li>Owner: {b.owner_name}</li>}
              {b.established_year && <li>Established: {b.established_year}</li>}
            </ul>
          </section>

          <section className="mt-14">
            <Link
              href="/businesses"
              className="inline-block px-5 py-2.5 rounded-full text-[14px] font-medium"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: TEXT }}
            >
              ← All businesses in Manipur
            </Link>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
}
