"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import PlaceDetailsModal from "@/components/discovery/PlaceDetailsModal";

interface Place {
  id: string;
  name: string;
  type: string;
  category?: string;
  coordinates?: [number, number];
  latitude?: number;
  longitude?: number;
  distance?: number;
  rating?: number;
  openingHours?: string;
  image?: string;
  image_urls?: string[];
  description?: string;
  contact?: string;
  price?: number;
  location?: string;
  features?: string[];
  nearby_places?: string[];
}

export default function DiscoverPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeTab, setActiveTab] = useState<
    "Hangout & Foods" | "Business" | "Events" | "Others"
  >("Hangout & Foods");

  // Default dark mode enabled
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase.from("places").select("*");
        if (error) return console.error(error);

        const formatted: Place[] = (data || []).map((p: any): Place => {
          let images: string[] = [];

          // Parse image URLs
          try {
            const parsed = JSON.parse(p.image_url);
            images = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            images = typeof p.image_url === "string" ? [p.image_url] : [];
          }

          const lat = Number(p.latitude);
          const lng = Number(p.longitude);

          return {
            id: p.id,
            name: p.name,
            type: p.type,
            category: p.category,
            image: images[0] || "/placeholder.jpg",
            image_urls: images,
            rating: Number(p.rating) || undefined,
            openingHours: p.opening_hours,
            location: p.location,
            description: p.description,
            contact: p.contact,
            price: p.price,
            features: Array.isArray(p.features) ? p.features : [],
            nearby_places:
              typeof p.nearby_places === "string"
                ? p.nearby_places.split(",")
                : p.nearby_places,
            latitude: !isNaN(lat) ? lat : undefined,
            longitude: !isNaN(lng) ? lng : undefined,
            coordinates:
              !isNaN(lat) && !isNaN(lng)
                ? ([lat, lng] as [number, number])
                : undefined,
          };
        });

        setPlaces(formatted);
      } catch (err) {
        console.error("Unexpected fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  // Tabs
  const tabs = ["Hangout & Foods", "Business", "Events", "Others"];

  // Search Filter
  const filtered = places.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouped Lists
  const events = filtered.filter((p) => p.type.toLowerCase() === "event");
  const business = filtered.filter((p) => p.type.toLowerCase() === "business");
  const others = filtered.filter(
    (p) => p.type.toLowerCase() !== "event" && p.type.toLowerCase() !== "business"
  );
  const hangouts = filtered.filter(
    (p) =>
      (p.category || "").toLowerCase().includes("food") ||
      (p.category || "").toLowerCase().includes("hangout")
  );

  const listToShow =
    activeTab === "Events"
      ? events
      : activeTab === "Business"
      ? business
      : activeTab === "Hangout & Foods"
      ? hangouts
      : others;

  // Rating Component
  const StarRow = ({ rating }: { rating?: number }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold">{rating ? rating.toFixed(1) : "-"}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${
              rating && rating > i ? "opacity-100" : "opacity-20"
            }`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 .587l3.668 7.431L24 9.748l-6 5.854L19.335 24 12 20.201 4.665 24 6 15.602 0 9.748l8.332-1.73z" />
          </svg>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
      } min-h-screen transition-colors duration-300`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 ${
          isDarkMode ? "bg-gray-900/95" : "bg-white/95"
        } backdrop-blur-sm border-b ${
          isDarkMode ? "border-gray-800" : "border-gray-300"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Mateng</span>
              <span className="text-xs text-gray-400">Discover nearby</span>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search restaurants, events, shops..."
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => setIsDarkMode((d) => !d)}
              className="px-3 py-2 border rounded-lg"
            >
              {isDarkMode ? "Light" : "Dark"}
            </button>

            <button className="px-3 py-2 bg-green-600 text-white rounded-lg">
              Filters
            </button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode((d) => !d)}
              className="p-2 border rounded-md text-xs"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <button className="p-2 border rounded-md">☰</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-4 py-2 text-sm rounded-full border ${
                activeTab === t
                  ? "bg-green-600 text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN BODY */}
      <main className="max-w-5xl mx-auto px-4 pb-24">
        {/* Events Tab */}
        {activeTab === "Events" ? (
          <div className="text-center py-20 opacity-80">
            <img src="/coming-soon.svg" className="w-40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Exciting events are coming!</h2>
          </div>
        ) : loading ? (
          // Skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 h-40"
              />
            ))}
          </div>
        ) : (
          // Actual list
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {listToShow.map((place) => (
              <article
                key={place.id}
                onClick={() => setSelectedPlace(place)}
                className={`rounded-2xl overflow-hidden border ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-800"
                    : "bg-white border-gray-200"
                } shadow-sm hover:shadow-md cursor-pointer`}
              >
                <div className="relative h-44 w-full">
                  <img
                    src={place.image}
                    className="w-full h-full object-cover"
                    alt={place.name}
                  />

                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/80 dark:bg-gray-800/60 text-xs">
                    {place.price ? `₹${place.price}` : "Open"}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold truncate max-w-[180px]">
                        {place.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">
                        {place.location || place.category}
                      </p>
                    </div>

                    <StarRow rating={place.rating} />
                  </div>

                  <p className="mt-3 text-xs text-gray-400 line-clamp-2">
                    {place.description || "Popular place to hangout."}
                  </p>

                  <div className="mt-4 flex justify-between items-center">
                    {/* Directions Button */}
                    <button
                      className="px-3 py-2 text-sm border rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        const lat = place.latitude || place.coordinates?.[0];
                        const lng = place.longitude || place.coordinates?.[1];

                        if (!lat || !lng) {
                          window.open(
                            `https://www.google.com/maps?q=${encodeURIComponent(
                              place.name
                            )}`,
                            "_blank"
                          );
                        } else {
                          window.open(
                            `https://www.google.com/maps?q=${lat},${lng}`,
                            "_blank"
                          );
                        }
                      }}
                    >
                      Directions
                    </button>

                    {/* Details Button */}
                    <button
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlace(place);
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-3 left-0 right-0 mx-auto max-w-5xl px-4 md:hidden">
        <div className="bg-white/95 dark:bg-gray-900/95 border rounded-2xl p-2 flex justify-between items-center shadow-lg">
          <button
            className={`flex-1 text-center py-2 rounded-lg ${
              activeTab === "Hangout & Foods"
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-200"
            }`}
            onClick={() => setActiveTab("Hangout & Foods")}
          >
            Home
          </button>

          <button
            className={`flex-1 text-center py-2 rounded-lg ${
              activeTab === "Business"
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-200"
            }`}
            onClick={() => setActiveTab("Business")}
          >
            Shops
          </button>

          <button
            className={`flex-1 text-center py-2 rounded-lg ${
              activeTab === "Events"
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-200"
            }`}
            onClick={() => setActiveTab("Events")}
          >
            Events
          </button>

          <button
            className={`flex-1 text-center py-2 rounded-lg ${
              activeTab === "Others"
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-200"
            }`}
            onClick={() => setActiveTab("Others")}
          >
            More
          </button>
        </div>
      </nav>

      {/* Desktop Right Panel */}
      <aside className="hidden md:block fixed right-6 top-28 w-40">
        <div
          className={`p-3 rounded-2xl border ${
            isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
          } shadow-sm`}
        >
          <h4 className="text-xs font-semibold">Quick filters</h4>
          <div className="mt-2 flex flex-col gap-2">
            <button className="text-xs px-3 py-2 text-left rounded-lg border">
              Veg only
            </button>
            <button className="text-xs px-3 py-2 text-left rounded-lg border">
              Top rated
            </button>
            <button className="text-xs px-3 py-2 text-left rounded-lg border">
              Offers
            </button>
          </div>
        </div>
      </aside>

      {/* DETAILS MODAL */}
      {selectedPlace && (
        <PlaceDetailsModal
          place={selectedPlace}
          isDark={isDarkMode}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
}
