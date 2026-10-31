// components/manipur/categories.ts
// Shared by the form (client) and the API route (server).
export const CATEGORIES = [
  "Place",
  "Food",
  "Festival",
  "Person",
  "Craft & handloom",
  "Sport",
  "Music & dance",
  "Business",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];