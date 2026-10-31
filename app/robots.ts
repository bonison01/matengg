// app/robots.ts — served at /robots.txt
// ---------------------------------------------------------------------------
// Deliberately minimal. robots.txt is a PUBLIC file, so listing private paths
// (/admin, /CargoDashboard, staff tools) here would publish a directory of
// them to anyone who opens it. Those routes are kept out of search with an
// `X-Robots-Tag: noindex` response header instead — see next.config.ts.
//
// Worth remembering: a robots.txt `Disallow` blocks crawling, not indexing. A
// disallowed URL linked from elsewhere can still surface as a bare result.
// `noindex` is the directive that actually keeps a page out.
// ---------------------------------------------------------------------------
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
