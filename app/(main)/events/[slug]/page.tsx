// app/(main)/events/[slug]/page.tsx
// ---------------------------------------------------------------------------
// Individual event page.
//
// Events created through the admin panel previously had no URL — only the four
// hardcoded event routes did — so they could never be indexed or earn Event
// rich results (the date/venue/price rows Google shows in search, which are
// the highest-CTR result type available to a ticketing platform).
//
// Next.js resolves static segments before dynamic ones, so the existing
// /events/matengfest, /events/summer-sound, /events/abok-ki-singju and
// /events/g15-festival routes still take precedence over this one.
//
// Events from the centralized events API (separate backend) are served here
// too: their slug is looked up there first, and the Supabase lookup below is
// the fallback, so both kinds of event live under /events/<slug>.
// ---------------------------------------------------------------------------
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/footer/Footer";
import { supabase } from "@/lib/supabaseClient";
import { findBySlug, entitySlug } from "@/lib/seo/slug";
import { buildMetadata, GEO, absoluteUrl } from "@/lib/seo/site";
import { JsonLd, graph, eventSchema, breadcrumbSchema } from "@/lib/seo/jsonLd";
import type { DBEvent } from "../EventsClient";
import ApiEventPage from "@/components/events-api/ApiEventPage";
import { eventService } from "@/lib/api/service";
import { ApiError } from "@/lib/api/api";
import { posterFrom } from "@/lib/events/apiEvents";
import { formatDateIST } from "@/lib/api/format";
import type { EventDetailResponse } from "@/lib/api/types";

export const revalidate = 900;

const TEXT = "#0B1410";
const MUTED = "#5B6B5D";
const GREEN = "#3FA637";
const GREEN_DARK = "#0F550C";
const CARD_BG = "#F6F7F4";
const CARD_BORDER = "#E1E5DE";

async function getEvent(slug: string): Promise<DBEvent | null> {
  const { data } = await supabase.from("events_full").select("*").neq("status", "draft");
  return findBySlug((data ?? []) as DBEvent[], slug);
}

/** Event from the centralized API, or null (404 or API unreachable). */
async function getApiEvent(slug: string): Promise<EventDetailResponse | null> {
  try {
    return await eventService.detail(slug, { next: { revalidate: 30 }, signal: AbortSignal.timeout(4000) });
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 404)) {
      console.warn(`[events] API lookup for "${slug}" failed:`, (err as Error)?.message);
    }
    return null;
  }
}

async function getApiCategoryName(categoryId: number) {
  try {
    const cats = await eventService.categories({ next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) });
    return cats.find((c) => c.id === categoryId)?.display_name;
  } catch {
    return undefined;
  }
}

function formatDate(d?: string | null) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return d;
  }
}

/** Maps our event status onto the schema.org eventStatus vocabulary. */
function schemaStatus(s?: string): "EventScheduled" | "EventPostponed" | "EventCancelled" | "EventRescheduled" {
  switch ((s || "").toLowerCase()) {
    case "postponed": return "EventPostponed";
    case "cancelled":
    case "canceled": return "EventCancelled";
    case "rescheduled": return "EventRescheduled";
    default: return "EventScheduled";
  }
}

/** Pulls a numeric price out of a free-text fee label like "₹200 per ticket". */
function priceFrom(label?: string): number | null {
  if (!label) return null;
  if (/free/i.test(label)) return 0;
  const m = label.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const api = await getApiEvent(slug);
  if (api) {
    const ev = api.event;
    const where = [ev.venue_name, ev.venue_city].filter(Boolean).join(", ") || GEO.city;
    const when = formatDateIST(ev.starts_at, { day: "numeric", month: "long", year: "numeric" });
    return buildMetadata({
      title: `${ev.title} — ${ev.venue_city || GEO.city}${when ? `, ${when}` : ""}`,
      description: `${(ev.subtitle || ev.description || `${ev.title} at ${where}.`).replace(/\s+/g, " ").slice(0, 110)} ${when}. Book tickets online with Mateng.`.slice(0, 158),
      path: `/events/${ev.slug}`,
      image: posterFrom(api.media),
      keywords: [ev.title, `${ev.title} tickets`, `events in ${ev.venue_city || GEO.city}`, "events in Manipur", "event tickets Imphal"],
    });
  }

  const e = await getEvent(slug);

  if (!e) {
    return buildMetadata({
      title: "Event not found",
      description: "This event is no longer listed on Mateng.",
      path: `/events/${slug}`,
      index: false,
    });
  }

  const where = e.venue ? `${e.venue}, ${e.city || GEO.city}` : e.city || GEO.city;
  const when = formatDate(e.date_start);
  const description = (
    e.subtitle?.trim() ||
    e.description?.replace(/\s+/g, " ").trim() ||
    `${e.title} at ${where}.`
  ).slice(0, 110);

  return buildMetadata({
    title: `${e.title} — ${e.city || GEO.city}${when ? `, ${when.split(",").slice(-2).join(",").trim()}` : ""}`,
    description: `${description} ${when ? `${when}. ` : ""}Book tickets online with Mateng.`.slice(0, 158),
    path: `/events/${entitySlug(e.title, e.id)}`,
    image: e.image_url || undefined,
    keywords: [
      e.title,
      `${e.title} tickets`,
      `events in ${e.city || GEO.city}`,
      "events in Manipur",
      "event tickets Imphal",
    ],
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const api = await getApiEvent(slug);
  if (api) {
    const ev = api.event;
    const path = `/events/${ev.slug}`;
    const minPrice = api.ticket_types.length
      ? Math.min(...api.ticket_types.map((t) => Number(t.price) || 0))
      : ev.pricing_mode === "free" ? 0 : null;
    return (
      <>
        <JsonLd
          data={graph(
            eventSchema({
              name: ev.title,
              description: (ev.description || ev.subtitle || ev.title).slice(0, 500),
              path,
              image: posterFrom(api.media),
              startDate: ev.starts_at,
              endDate: ev.ends_at,
              venueName: ev.venue_name || GEO.city,
              venueAddress: ev.venue_address || [ev.venue_name, ev.venue_city].filter(Boolean).join(", "),
              price: minPrice,
              status: ev.status === "cancelled" ? "EventCancelled" : "EventScheduled",
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Events", path: "/events" },
              { name: ev.title, path },
            ])
          )}
        />
        <ApiEventPage data={api} categoryName={await getApiCategoryName(ev.category_id)} />
      </>
    );
  }

  const e = await getEvent(slug);
  if (!e) notFound();

  const path = `/events/${entitySlug(e.title, e.id)}`;
  const where = [e.venue, e.city || GEO.city].filter(Boolean).join(", ");
  const price = priceFrom(e.fee_label);

  return (
    <>
      <JsonLd
        data={graph(
          eventSchema({
            name: e.title,
            description: (e.description || e.subtitle || e.title).slice(0, 500),
            path,
            image: e.image_url,
            startDate: e.date_start,
            endDate: e.date_end,
            venueName: e.venue,
            venueAddress: e.venue,
            price,
            status: schemaStatus(e.status),
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: e.title, path },
          ])
        )}
      />

      <div
        style={{ background: "#FFFFFF", color: TEXT, position: "relative", zIndex: 1 }}
        className="w-full min-h-screen"
      >
        <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-10 pb-4">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[13px]" style={{ color: MUTED }}>
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/events" className="hover:underline">Events</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{e.title}</li>
            </ol>
          </nav>

          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-4" style={{ color: GREEN_DARK }}>
            {e.category}
            {e.status && e.status !== "open" ? ` · ${e.status}` : ""}
          </p>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl leading-[1.12] font-semibold"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {e.title}
          </h1>

          {e.subtitle && (
            <p className="mt-4 text-[17px] leading-[1.7]" style={{ color: MUTED }}>{e.subtitle}</p>
          )}

          <dl className="mt-7 space-y-2 text-[16px]" style={{ color: MUTED }}>
            {e.date_start && (
              <div className="flex gap-2">
                <dt className="font-semibold" style={{ color: TEXT }}>When:</dt>
                <dd>{formatDate(e.date_start)}{e.time_start ? `, ${e.time_start}` : ""}</dd>
              </div>
            )}
            {where && (
              <div className="flex gap-2">
                <dt className="font-semibold" style={{ color: TEXT }}>Where:</dt>
                <dd>{where}</dd>
              </div>
            )}
            {e.fee_label && (
              <div className="flex gap-2">
                <dt className="font-semibold" style={{ color: TEXT }}>Tickets:</dt>
                <dd>{e.fee_label}</dd>
              </div>
            )}
            {e.organizer_name && (
              <div className="flex gap-2">
                <dt className="font-semibold" style={{ color: TEXT }}>Organiser:</dt>
                <dd>{e.organizer_name}</dd>
              </div>
            )}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {e.register_href && (
              <a
                href={e.register_href}
                className="px-7 py-3 rounded-full font-semibold text-white"
                style={{ background: GREEN }}
              >
                Get tickets
              </a>
            )}
            {e.page_href && (
              <Link
                href={e.page_href}
                className="px-7 py-3 rounded-full font-semibold border"
                style={{ borderColor: CARD_BORDER, color: TEXT }}
              >
                Event page
              </Link>
            )}
            {e.contact_phone && (
              <a href={`tel:${e.contact_phone}`} className="px-5 py-3 font-semibold hover:underline" style={{ color: GREEN_DARK }}>
                {e.contact_phone}
              </a>
            )}
          </div>
        </div>

        {e.image_url && (
          <div className="max-w-3xl mx-auto px-5 sm:px-6 mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={e.image_url}
              alt={`${e.title} — ${e.category} event in ${e.city || GEO.city}, ${GEO.state}`}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full rounded-2xl object-cover"
              style={{ maxHeight: 460 }}
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-8">
          {e.description && (
            <section className="mt-8">
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                About this event
              </h2>
              <p className="mt-4 text-[16px] leading-[1.75] whitespace-pre-line" style={{ color: MUTED }}>
                {e.description}
              </p>
            </section>
          )}

          {e.lineup?.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                Line-up
              </h2>
              <ul className="mt-5 space-y-2.5">
                {e.lineup.map((l, i) => (
                  <li key={i} className="flex gap-3 text-[16px]" style={{ color: MUTED }}>
                    <span aria-hidden="true" style={{ color: GREEN }} className="font-bold">—</span>
                    <span>{typeof l === "string" ? l : (l as { name?: string }).name ?? JSON.stringify(l)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {e.schedule?.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                Schedule
              </h2>
              <ul className="mt-5 space-y-2.5">
                {e.schedule.map((s, i) => (
                  <li key={i} className="flex gap-3 text-[16px]" style={{ color: MUTED }}>
                    <span aria-hidden="true" style={{ color: GREEN }} className="font-bold">—</span>
                    <span>{typeof s === "string" ? s : (s as { label?: string }).label ?? JSON.stringify(s)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-14">
            <Link
              href="/events"
              className="inline-block px-5 py-2.5 rounded-full text-[14px] font-medium"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: TEXT }}
            >
              ← All events in Manipur
            </Link>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
}
