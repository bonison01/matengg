import type { NextConfig } from "next";

/**
 * Routes that must never appear in search results: admin, staff tooling and
 * personal/transactional surfaces.
 *
 * These are handled with an `X-Robots-Tag: noindex` response header rather
 * than a robots.txt `Disallow`, for two reasons:
 *   1. robots.txt is public — listing these paths there would publish a
 *      directory of private URLs to anyone who opens it.
 *   2. `Disallow` blocks crawling, not indexing. A disallowed URL linked from
 *      elsewhere can still surface as a bare result. `noindex` actually keeps
 *      it out.
 * The header is invisible to visitors and changes nothing about how these
 * pages render or behave.
 */
const NOINDEX_PATHS = [
  "/admin/:path*",
  "/api/:path*",
  "/cart/:path*",
  "/cart",
  "/profile/:path*",
  "/profile",
  "/login",
  "/account/:path*",
  "/events/confirmation",
  "/events/:slug/checkout",
  "/events/:slug/confirmation",
  "/booking/:path*",
  "/booking_confirmation",
  "/book-fair-dashboard",
  "/book_fair_pass_card",
  "/CargoDashboard/:path*",
  "/CargoDashboard",
  "/employee_contracts/:path*",
  "/employee_contracts",
  "/joining_form",
  "/tables-students",
  "/lottery",
  "/track",
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  compress: true,
  // The "Powered by Next.js" header leaks stack information for no benefit.
  poweredByHeader: false,

  images: {
    // AVIF/WebP cut image weight substantially, which is the largest lever on
    // LCP for this site's photo-heavy pages.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mdxeolqfiosscdommyhc.supabase.co",
      },
      {
        protocol: "https",
        hostname: "uqtcgvxrcztaffzpxsql.supabase.co",
      },
      {
        // Events API media (posters). The bucket sends no CORS headers, so
        // the downloadable ticket loads posters through /_next/image
        // (same-origin) to embed them in the PNG.
        protocol: "https",
        hostname: "mateng-candidate-bucket.s3.ap-south-1.amazonaws.com",
      },
    ],
  },

  async redirects() {
    return [
      {
        // www and apex both served 200, so Google saw two complete copies of
        // the site competing with each other. Apex is canonical.
        source: "/:path*",
        has: [{ type: "host", value: "www.justmateng.com" }],
        destination: "https://justmateng.com/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      ...NOINDEX_PATHS.map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
