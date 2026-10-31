// app/(main)/events/page.tsx
import { supabase } from "@/lib/supabaseClient";
import EventsClient from "./EventsClient";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp?.search;
  const initialSearch = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const [eventsRes, bannersRes] = await Promise.all([
    supabase.from("events_full").select("*").neq("status", "draft"),
    supabase.from("active_banners").select("*"),
  ]);

  return (
    <EventsClient
      initialEvents={(eventsRes.data ?? []) as never[]}
      initialBanners={(bannersRes.data ?? []) as never[]}
      initialSearch={initialSearch}
      apiEvents={[]}
    />
  );
}