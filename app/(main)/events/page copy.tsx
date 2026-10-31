// app/(main)/events/page.tsx
// Server shell for event discovery.
//
// This page previously rendered nothing at all on the server: its content sat
// inside <Suspense fallback={null}> and the inner component called
// useSearchParams, which forces the boundary to emit its fallback during
// prerender. Crawlers received an empty page, so no event was discoverable.
//
// Events and banners are now fetched here and passed down, and the search term
// is read from the URL on the server, so the full listing is in the HTML.
import { supabase } from "@/lib/supabaseClient";
import EventsClient from "./EventsClient";
import { mergeCuratedEvents } from "@/lib/events/curatedEvents";
import { fetchApiEventsForListing } from "@/lib/events/apiEvents";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp?.search;
  const initialSearch = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  // Fetched in parallel — a failure on either degrades to the client fetch
  // rather than breaking the page.
  // The centralized events API is a separate backend; it never throws here
  // and simply contributes nothing if it is unreachable.
  const [eventsRes, bannersRes, apiEvents] = await Promise.all([
    supabase.from("events_full").select("*").neq("status", "draft"),
    supabase.from("active_banners").select("*"),
    fetchApiEventsForListing(),
  ]);

  // Some events have a hand-built landing page but were never entered in the
  // admin panel, so they have no row in `events_full`. Merge those in so they
  // still appear in the listing.
  const events = mergeCuratedEvents((eventsRes.data ?? []) as never[]);

  return (
    <EventsClient
      initialEvents={events as never[]}
      initialBanners={(bannersRes.data ?? []) as never[]}
      initialSearch={initialSearch}
      apiEvents={apiEvents}
    />
  );
}
