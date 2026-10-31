import type { ReactNode } from "react";

export type Service = { tag: string; title: string; body: string; icon: ReactNode };

export const SERVICES: Service[] = [
  {
    tag: "Discovery",
    title: "Events & Competitions",
    body: "Structured competitions and events helping students showcase their skills.",
    icon: (
      <path d="M11 4a7 7 0 105.29 12.29l4.2 4.2 1.42-1.41-4.2-4.2A7 7 0 0011 4zm0 2a5 5 0 110 10 5 5 0 010-10z" />
    ),
  },
  {
    tag: "Local Business",
    title: "Business Discovery",
    body: "Helping local businesses become discoverable and connect with customers.",
    icon: (
      <path d="M4 4h16v4l-1 1v11h-6v-6H11v6H5V9L4 8V4zm2 2v1.17L6.83 8H17.2l.8-1V6H6z" />
    ),
  },
  {
    tag: "Logistics",
    title: "Delivery",
    body: "Reliable hyperlocal delivery and porter services helping businesses move goods quickly.",
    icon: (
      <path d="M3 6h11v7h2.5l2.5 3.5V17h1v2h-2a2 2 0 11-4 0H8a2 2 0 11-4 0H3V6zm2 2v7h.28a2 2 0 013.44 0H12V8H5zm10 4v2h2l-1.5-2H15z" />
    ),
  },
];

export const PARTNERS = [
  { name: "175c", logo: "/partners/partner1.png" },
  { name: "Coffee Culture", logo: "/partners/partner2.png" },
  { name: "Laija Trends", logo: "/partners/partner3.png" },
  { name: "Shija Hospitals and Research Institute (SHRI)", logo: "/partners/partner7.png" },
  { name: "Safe Sight Eye Care", logo: "/partners/partner5.png" },
  { name: "Vegnus Health and Beauty", logo: "/partners/partner6.png" },
  { name: "PB Online Store", logo: "/partners/partner4.png" },
  { name: "Cleaneteria", logo: "/partners/cleaneteria.png" },
];

export const IMPACT_STATS = [
  { key: "parcels", target: 200, step: 2, suffix: "K", label: "Parcels delivered" },
  { key: "merchants", target: 400, step: 5, suffix: "+", label: "Merchants" },
  { key: "businesses", target: 180, step: 3, suffix: "+", label: "Businesses discovered" },
] as const;

export const DELIVERY_URL = "https://matengdelivery.com/";
