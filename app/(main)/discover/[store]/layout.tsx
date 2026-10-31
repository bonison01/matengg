// app/(main)/discover/[store]/layout.tsx — per-storefront SEO metadata
// Each business storefront gets its own title, description and LocalBusiness
// structured data, so it can rank for its own name plus "in Imphal/Manipur".
// Purely server-side; the visible page is unchanged.
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, GEO, absoluteUrl } from "@/lib/seo/site";
import { JsonLd, graph, breadcrumbSchema } from "@/lib/seo/jsonLd";
import { SITE_URL } from "@/lib/seo/site";

type Props = { params: Promise<{ store: string }> };

async function getStore(id: string) {
  try {
    return await prisma.users.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        business_name: true,
        business_type: true,
        product_service: true,
        photo: true,
        rating: true,
        categories: true,
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store } = await params;
  const s = await getStore(store);

  if (!s?.business_name) {
    return buildMetadata({
      title: "Business not found",
      description: "This business listing is no longer available on Mateng.",
      path: `/discover/${store}`,
      index: false,
    });
  }

  const type = s.business_type ? `${s.business_type} · ` : "";
  return buildMetadata({
    title: `${s.business_name} — ${GEO.city}, ${GEO.state}`,
    description:
      `${type}${s.business_name} in ${GEO.city}, ${GEO.state}. ` +
      `${s.product_service ? `${s.product_service}. ` : ""}View products, contact details and reviews on Mateng.`.slice(0, 160),
    path: `/discover/${store}`,
    image: s.photo || undefined,
    keywords: [
      s.business_name,
      `${s.business_name} Imphal`,
      `${s.business_type ?? "business"} in Imphal`,
      "local businesses in Manipur",
    ].filter(Boolean) as string[],
  });
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  const s = await getStore(store);

  return (
    <>
      {s?.business_name && (
        <JsonLd
          data={graph(
            {
              "@type": "LocalBusiness",
              "@id": `${absoluteUrl(`/discover/${store}`)}#business`,
              name: s.business_name,
              url: absoluteUrl(`/discover/${store}`),
              image: s.photo || undefined,
              description: s.product_service || undefined,
              address: {
                "@type": "PostalAddress",
                addressLocality: GEO.city,
                addressRegion: GEO.state,
                addressCountry: GEO.country,
              },
              areaServed: [
                { "@type": "City", name: GEO.city },
                { "@type": "State", name: GEO.state },
              ],
              // Only emit a rating when there is a real one — fabricated or
              // zero-count ratings are a structured-data violation.
              ...(s.rating && Number(s.rating) > 0
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: Number(s.rating),
                      bestRating: 5,
                    },
                  }
                : {}),
              isPartOf: { "@id": `${SITE_URL}/#website` },
            },
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Discover", path: "/discover" },
              { name: s.business_name, path: `/discover/${store}` },
            ])
          )}
        />
      )}
      {children}
    </>
  );
}
