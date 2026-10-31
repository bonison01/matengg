// app/sitemap.ts — served at /sitemap.xml
// ---------------------------------------------------------------------------
// Static routes are listed explicitly with hand-set priorities (money pages
// first). Dynamic routes — blog posts, places and business storefronts — are
// pulled live so new content is discoverable without a redeploy.
// ---------------------------------------------------------------------------
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { supabase } from "@/lib/supabaseClient";
import { prisma } from "@/lib/prisma";
import { entitySlug } from "@/lib/seo/slug";

// Re-generated hourly. Frequent enough for new blog posts and listings,
// cheap enough not to hit the database on every crawl.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },

  // NOTE: a sitemap should list the pages the site actually links to. The
  // service landing pages (/delivery, /cargo, /packaging,
  // /business-promotion-manipur, /event-ticketing-manipur and their children)
  // are intentionally absent — nothing on the site links to them, so they are
  // not part of what is served today. Add them back here at the same time as
  // the internal links, not before.

  // Product surfaces.
  { path: "/discover", priority: 0.9, changeFrequency: "daily" },
  { path: "/businesses", priority: 0.9, changeFrequency: "daily" },
  { path: "/events", priority: 0.9, changeFrequency: "daily" },
  { path: "/blog", priority: 0.8, changeFrequency: "daily" },
  { path: "/delivery-rates", priority: 0.8, changeFrequency: "monthly" },
  { path: "/CargoBookingPage", priority: 0.8, changeFrequency: "monthly" },
  { path: "/RouteRatesPage", priority: 0.7, changeFrequency: "monthly" },
  { path: "/light-vehicle", priority: 0.6, changeFrequency: "monthly" },
  { path: "/products", priority: 0.6, changeFrequency: "weekly" },
  { path: "/listing/businesses", priority: 0.6, changeFrequency: "weekly" },
  { path: "/listing/events", priority: 0.6, changeFrequency: "weekly" },

  // Trust / company pages.
  { path: "/about-us", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact-us", priority: 0.6, changeFrequency: "monthly" },
  { path: "/applynow", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy_policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms/mateng-event", priority: 0.2, changeFrequency: "yearly" },
];

/** Landing pages for individual events that live at their own route. */
const EVENT_ROUTES = [
  "/events/matengfest",
  "/events/summer-sound",
  "/events/abok-ki-singju",
  "/events/g15-festival",
];

async function blogEntries(): Promise<Entry[]> {
  try {
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, published_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1000);

    return (data ?? [])
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: new Date(p.published_at ?? p.created_at ?? Date.now()),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
  } catch {
    // A sitemap that renders without the dynamic section is far better than a
    // sitemap that 500s, so database failures degrade quietly.
    return [];
  }
}

async function placeEntries(): Promise<Entry[]> {
  try {
    const { data } = await supabase.from("places").select("id, created_at").limit(2000);
    return (data ?? []).map((p) => ({
      url: `${SITE_URL}/place/${p.id}`,
      lastModified: new Date(p.created_at ?? Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

/** One URL per verified business — the pages that carry the discovery cluster. */
async function businessEntries(): Promise<Entry[]> {
  try {
    const { data } = await supabase
      .from("businesses_full")
      .select("id, name")
      .eq("verified", true)
      .limit(5000);

    return (data ?? [])
      .filter((b) => b.id && b.name)
      .map((b) => ({
        url: `${SITE_URL}/businesses/${entitySlug(b.name, b.id)}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    return [];
  }
}

/** One URL per published event, so each can earn an Event rich result. */
async function eventEntries(): Promise<Entry[]> {
  try {
    const { data } = await supabase
      .from("events_full")
      .select("id, title, date_start")
      .neq("status", "draft")
      .limit(2000);

    return (data ?? [])
      .filter((e) => e.id && e.title)
      .map((e) => ({
        url: `${SITE_URL}/events/${entitySlug(e.title, e.id)}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.85,
      }));
  } catch {
    return [];
  }
}

async function storeEntries(): Promise<Entry[]> {
  try {
    const stores = await prisma.users.findMany({
      where: { is_business_owner: true },
      select: { user_id: true },
      take: 5000,
    });
    return stores.map((s) => ({
      url: `${SITE_URL}/discover/${s.user_id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: Entry[] = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path === "/" ? "" : r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const staticEventEntries: Entry[] = EVENT_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const [blog, places, stores, businesses, events] = await Promise.all([
    blogEntries(),
    placeEntries(),
    storeEntries(),
    businessEntries(),
    eventEntries(),
  ]);

  // De-duplicate: a hardcoded event route and its database row can resolve to
  // the same event, and a duplicate <loc> makes Search Console flag the file.
  const all = [...staticEntries, ...staticEventEntries, ...blog, ...places, ...stores, ...businesses, ...events];
  const seen = new Set<string>();
  return all.filter((e) => {
    const url = String(e.url);
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}
