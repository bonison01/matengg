// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { MapProvider } from "@/components/context/MapContext";

import { DarkModeProvider } from "@/components/DarkModeContext";
import DarkModeWrapper from "@/components/DarkModeWrapper";

import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo/site";
import { pageKeywords } from "@/lib/seo/keywords";
import { JsonLd, graph, organizationSchema, webSiteSchema, localBusinessSchema } from "@/lib/seo/jsonLd";
import Analytics from "@/components/analytics/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // metadataBase makes every relative canonical/OG URL resolve to the canonical
  // host. Without it Next emits relative OG URLs, which crawlers ignore.
  metadataBase: new URL(SITE_URL),
  title: {
    // Pages set only their own title; the brand suffix is appended here so it
    // is consistent and never duplicated.
    default: "Mateng — Business Discovery, Delivery & Event Ticketing in Manipur",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Mateng is Manipur's local platform — discover local businesses in Imphal, book hyperlocal delivery and Imphal–Delhi cargo, and buy event tickets online.",
  keywords: pageKeywords("/"),
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Local services",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: SITE_URL,
    title: "Mateng — Business Discovery, Delivery & Event Ticketing in Manipur",
    description:
      "Discover local businesses in Imphal and Manipur, book delivery and cargo, and buy event tickets online with Mateng.",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mateng — Business Discovery, Delivery & Event Ticketing in Manipur",
    description:
      "Manipur's local platform for business discovery, hyperlocal delivery and online event ticketing.",
    images: [DEFAULT_OG_IMAGE.url],
  },
  icons: {
    icon: "/favi.png",
    apple: "/favi.png",
  },
  // Paste the token from Google Search Console → Settings → Ownership
  // verification → HTML tag, then redeploy.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale/userScalable were previously locked, which blocks pinch-zoom.
  // That is an accessibility failure Lighthouse reports and Google counts as a
  // page-experience negative, so zooming is allowed again.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F1EA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F0B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // en-IN tells Google the page targets Indian English, which helps it
    // surface the site for India-local queries.
    <html lang="en-IN">
      <head>
        {/* Site-wide entity graph: brand, website (search box) and the local
            business node that makes Mateng eligible for the Imphal local pack. */}
        <JsonLd data={graph(organizationSchema(), webSiteSchema(), localBusinessSchema())} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <DarkModeProvider>
            <DarkModeWrapper>
              <div className="w-full custom-bg relative">
                <div className="lines">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
                <div className="bg-overlay"></div>
                <MapProvider>{children}</MapProvider>
              </div>
            </DarkModeWrapper>
          </DarkModeProvider>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
