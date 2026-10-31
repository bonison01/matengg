// app/(main)/businesses/page.tsx
// Server shell for the business directory. The listing was fetched in a
// useEffect, so the page arrived at crawlers empty — no business name,
// category or description was ever in the HTML. It is now fetched here and
// passed in as initial state; the rendered result is unchanged.
import { supabase } from "@/lib/supabaseClient";
import BusinessesClient from "./BusinessesClient";

export const revalidate = 1800;

export default async function BusinessesPage() {
  const { data } = await supabase
    .from("businesses_full")
    .select("*")
    .eq("verified", true);

  return <BusinessesClient initialBusinesses={(data ?? []) as never[]} />;
}
