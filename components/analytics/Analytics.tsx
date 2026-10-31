// components/analytics/Analytics.tsx
// ---------------------------------------------------------------------------
// GA4 + Meta Pixel loader, plus App Router pageview tracking.
//
// Both scripts use strategy="afterInteractive": they load after the page is
// interactive, so they never block first paint or cost you LCP/INP in
// Lighthouse — analytics must not be the reason a Core Web Vitals score drops.
//
// If an ID env var is unset the corresponding script is simply not rendered,
// so local dev and preview deploys stay out of production reporting.
// ---------------------------------------------------------------------------
"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_ID, META_PIXEL_ID, trackPageview } from "@/lib/analytics/events";

/**
 * useSearchParams() opts a component into client-side rendering, so it is
 * isolated in its own Suspense-wrapped child. Without that boundary the whole
 * route would be forced out of static generation.
 */
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    trackPageview(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  // Nothing configured — render nothing rather than an empty <script>.
  if (!GA_ID && !META_PIXEL_ID) return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              // send_page_view is disabled here because PageviewTracker below
              // sends every pageview, including client-side navigations.
              // Leaving it on would double-count the first page of a session.
              gtag('config', '${GA_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}

      {META_PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
          `}
        </Script>
      )}

      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
    </>
  );
}
