// lib/seo/slug.ts
// ---------------------------------------------------------------------------
// URL slugs for businesses and events.
//
// Neither `businesses_full` nor `events_full` has a slug column, and adding one
// would mean a migration plus backfill. Instead a slug is derived from the
// entity's name and suffixed with a short piece of its id:
//
//     "Shija Hospital"  +  id 7c2f…  ->  /businesses/shija-hospital-7c2f9a10
//
// That keeps the keywords in the URL (which matters — the name is usually the
// exact query someone searches) while staying unique and stable, and it lets
// the id be read straight back out of the slug without a lookup table.
// ---------------------------------------------------------------------------

/** Length of the id fragment appended to each slug. */
const ID_LEN = 8;

/** Lowercase, ASCII, hyphen-separated. Diacritics are stripped, not dropped. */
export function toSlug(input: string): string {
  return (input || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

/** Builds the public slug for an entity: "readable-name-<idfragment>". */
export function entitySlug(name: string, id: string): string {
  const base = toSlug(name);
  const short = String(id).replace(/-/g, "").slice(0, ID_LEN);
  return base ? `${base}-${short}` : short;
}

/**
 * Recovers the id fragment from a slug. Returns null when the slug has no
 * recognisable trailing fragment, so callers can 404 rather than query with
 * a garbage value.
 */
export function idFragmentFromSlug(slug: string): string | null {
  const m = String(slug || "").match(new RegExp(`([a-z0-9]{${ID_LEN}})$`, "i"));
  return m ? m[1].toLowerCase() : null;
}

/**
 * Matches a slug against a list of rows by comparing the id fragment.
 *
 * The comparison is done in application code rather than SQL because the
 * fragment is the id with hyphens removed, which no portable SQL predicate
 * expresses cleanly across both UUID and text id columns.
 */
export function findBySlug<T extends { id: string }>(rows: T[], slug: string): T | null {
  const frag = idFragmentFromSlug(slug);
  if (!frag) return null;
  return (
    rows.find((r) => String(r.id).replace(/-/g, "").slice(0, ID_LEN).toLowerCase() === frag) ?? null
  );
}
