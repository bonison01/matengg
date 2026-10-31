// lib/analytics/events.ts
// ---------------------------------------------------------------------------
// One typed entry point for every analytics event on the site. Components call
// `track(...)` and never touch `window.gtag` / `window.fbq` directly, so that:
//   - an event name is defined once and cannot drift between call sites,
//   - a missing/blocked script is a no-op instead of a runtime TypeError,
//   - adding a third destination later means editing this file only.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Meta's "standard events" get richer reporting than custom ones. */
const META_STANDARD = new Set([
  "PageView", "ViewContent", "Search", "AddToCart", "InitiateCheckout",
  "Purchase", "Lead", "CompleteRegistration", "Contact",
]);

type Params = Record<string, string | number | boolean | undefined>;

/**
 * Sends one event to every configured destination.
 * Safe to call during SSR, before the scripts load, or with an ad blocker
 * active — each destination is guarded independently.
 */
export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;

  window.gtag?.("event", event, params);

  if (window.fbq) {
    const verb = META_STANDARD.has(event) ? "track" : "trackCustom";
    window.fbq(verb, event, params);
  }
}

/**
 * Fires a pageview on the analytics destinations.
 * Needed because the App Router navigates client-side: gtag's automatic
 * page_view only fires on the initial script `config`, so every subsequent
 * in-app navigation would otherwise go unrecorded.
 */
export function trackPageview(url: string) {
  if (typeof window === "undefined") return;

  if (GA_ID) window.gtag?.("event", "page_view", { page_path: url, page_location: window.location.href });
  window.fbq?.("track", "PageView");
}
