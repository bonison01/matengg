// app/(main)/discover/page.tsx
// Server shell for business discovery. The storefront list was previously
// fetched from /api/stores in a useEffect, so crawlers saw an empty directory
// and never reached the individual /discover/[store] pages. The same query now
// runs on the server and is handed to the client component as initial state.
import { prisma } from "@/lib/prisma";
import DiscoverClient from "./DiscoverClient";
import type { Store } from "@/utils/types/store";

export const revalidate = 1800;

export default async function DiscoverPage() {
  let stores: Store[] = [];

  try {
    // Mirrors /api/stores exactly, so the rendered list is unchanged.
    const rows = await prisma.users.findMany({
      where: { is_business_owner: true },
      select: {
        user_id: true,
        business_name: true,
        business_type: true,
        product_service: true,
        business_experience: true,
        photo: true,
        categories: true,
        rating: true,
        whatsapp: true,
      },
      orderBy: { business_name: "asc" },
    });
    stores = rows as unknown as Store[];
  } catch {
    // Fall through with an empty list — the client component still runs its
    // own fetch in that case, so the page degrades to its previous behaviour
    // rather than erroring.
    stores = [];
  }

  return <DiscoverClient initialStores={stores} />;
}
