// app/(main)/place/[id]/page.tsx

import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { PlaceDetailClient } from "./PlaceDetailClient"; // Client component
import { buildMetadata, GEO, absoluteUrl } from "@/lib/seo/site";
import { JsonLd, graph, breadcrumbSchema } from "@/lib/seo/jsonLd";

interface Place {
  id: string;
  name: string;
  image?: string;
  description?: string;
  location?: string;
  features: string[];
  contact?: string;
  type: string;
  price?: number;
  nearby_places?: string | string[] | null; // Add this line
}

async function getPlace(id: string) {
  const { data } = await supabase.from("places").select("*").eq("id", id).single();
  return data;
}

/**
 * Each place gets its own title, description and Place structured data so it
 * can rank for its own name alongside "in Imphal" / "in Manipur". Metadata
 * only — the rendered page is unchanged.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const place = await getPlace(id);

  if (!place) {
    return buildMetadata({
      title: "Place not found",
      description: "This listing is no longer available on Mateng.",
      path: `/place/${id}`,
      index: false,
    });
  }

  const where = place.location || `${GEO.city}, ${GEO.state}`;
  const description = (
    place.description?.replace(/\s+/g, " ").trim() ||
    `${place.name} in ${where}. Photos, features, contact details and reviews on Mateng.`
  ).slice(0, 158);

  return buildMetadata({
    title: `${place.name} — ${where}`,
    description,
    path: `/place/${id}`,
    image: place.image_url || undefined,
    keywords: [
      place.name,
      `${place.name} Imphal`,
      place.type ? `${place.type} in Imphal` : "",
      "local places in Manipur",
      "local places in Imphal",
    ].filter(Boolean) as string[],
  });
}

// ⚠️ Correctly type params as a Promise
export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Await the params object to access its properties
  const { id } = await params;

  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return notFound();
  }

  const place: Place = {
    id: data.id,
    name: data.name,
    image: data.image_url,
    description: data.description,
    location: data.location,
    features: Array.isArray(data.features) ? data.features : [],
    contact: data.contact,
    type: data.type,
    price: data.price,
    nearby_places: data.nearby_places, // ✅ Add this
  };

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "Place",
            "@id": `${absoluteUrl(`/place/${id}`)}#place`,
            name: place.name,
            url: absoluteUrl(`/place/${id}`),
            image: place.image ? [place.image] : undefined,
            description: place.description || undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: place.location || undefined,
              addressLocality: GEO.city,
              addressRegion: GEO.state,
              addressCountry: GEO.country,
            },
            telephone: place.contact || undefined,
          },
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Discover", path: "/discover" },
            { name: place.name, path: `/place/${id}` },
          ])
        )}
      />
      <PlaceDetailClient place={place} />
    </>
  );
}