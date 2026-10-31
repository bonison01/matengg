"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import { Utensils, Building, Calendar, MoreHorizontal } from "lucide-react";

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

type TabType = "Hangout & Foods" | "Business" | "Events" | "Others";

export default function DiscoverPageModalVersion() {
  const router = useRouter();

  // Core UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("Hangout & Foods");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

  // Modal & selected place
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Ratings state
  const [userRating, setUserRating] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [pendingRating, setPendingRating] = useState<number | null>(null);

  // -----------------------------------
  // Fetch Places From Supabase
  // -----------------------------------
  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("places").select("*");
        if (error) {
          console.error("Error fetching places:", error);
          return;
        }

        const formatted: Place[] = (data || []).map((p: any): Place => {
          let images: string[] = [];

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
            rating: p.rating ? Number(p.rating) : undefined,
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
        console.error("Unexpected error fetching places:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  // -----------------------------------
  // Tabs & Filtering
  // -----------------------------------
  const tabs: TabType[] = ["Hangout & Foods", "Business", "Events", "Others"];

  const filtered = places.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const events = filtered.filter((p) => p.type.toLowerCase() === "event");
  const business = filtered.filter((p) => p.type.toLowerCase() === "business");
  const others = filtered.filter(
    (p) =>
      p.type.toLowerCase() !== "event" && p.type.toLowerCase() !== "business"
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

  // -----------------------------------
  // Read-only Star Row (cards)
  // -----------------------------------
  const StarRow = ({ rating }: { rating?: number }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold">{rating ? rating.toFixed(1) : "-"}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${
              rating && rating > i
                ? "opacity-100 text-yellow-400"
                : "opacity-20 text-gray-400"
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

  // -----------------------------------
  // Rating Helpers (Anonymous / Device-based)
  // -----------------------------------
  const getDeviceId = () => {
    if (typeof window === "undefined") return ""; // SSR safety
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("device_id", id);
    }
    return id;
  };

  const fetchAverageRating = async (place_id: string) => {
    try {
      const { data, error } = await supabase
        .from("place_ratings")
        .select("rating")
        .eq("place_id", place_id);

      if (error) {
        console.error("Error fetching average rating:", error);
        setAverageRating(null);
        return;
      }

      if (!data || data.length === 0) {
        setAverageRating(null);
        return;
      }

      const avg =
        data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
      setAverageRating(avg);
    } catch (err) {
      console.error("Unexpected error fetching average rating:", err);
      setAverageRating(null);
    }
  };

  const getUserRating = async (place_id: string) => {
    try {
      const deviceId = getDeviceId();
      if (!deviceId) {
        setUserRating(0);
        return;
      }

      const { data, error } = await supabase
        .from("place_ratings")
        .select("rating")
        .eq("place_id", place_id)
        .eq("device_id", deviceId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user rating:", error);
        setUserRating(0);
        return;
      }

      setUserRating(data?.rating || 0);
    } catch (err) {
      console.error("Unexpected error fetching user rating:", err);
      setUserRating(0);
    }
  };

  const selectRating = (rating: number) => {
    setPendingRating(rating);
  };

  const submitRating = async () => {
    if (!selectedPlace || pendingRating === null) return;

    try {
      const deviceId = getDeviceId();
      if (!deviceId) return;

      // Remove previous rating for this device & place
      const { error: deleteError } = await supabase
        .from("place_ratings")
        .delete()
        .eq("place_id", selectedPlace.id)
        .eq("device_id", deviceId);

      if (deleteError) {
        console.error("Error deleting existing rating:", deleteError);
      }

      // Insert new rating
      const { error: insertError } = await supabase
        .from("place_ratings")
        .insert({
          place_id: selectedPlace.id,
          rating: pendingRating,
          device_id: deviceId,
        });

      if (insertError) {
        console.error("Error inserting rating:", insertError);
        return;
      }

      setUserRating(pendingRating);
      setPendingRating(null);
      fetchAverageRating(selectedPlace.id);
    } catch (err) {
      console.error("Unexpected error submitting rating:", err);
    }
  };

  const openPlaceModal = (place: Place) => {
    setSelectedPlace(place);
    setIsDetailsOpen(true);
    setAverageRating(null);
    setUserRating(0);
    setPendingRating(null);

    fetchAverageRating(place.id);
    getUserRating(place.id);
  };

  const closeModal = () => {
    setIsDetailsOpen(false);
    setSelectedPlace(null);
    setPendingRating(null);
  };

  // -----------------------------------
  // Directions helper
  // -----------------------------------
  const openDirections = (place: Place) => {
    const lat = place.latitude || place.coordinates?.[0];
    const lng = place.longitude || place.coordinates?.[1];

    if (!lat || !lng) {
      window.open(
        `https://www.google.com/maps?q=${encodeURIComponent(place.name)}`,
        "_blank"
      );
    } else {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    }
  };

  // -----------------------------------
  // Render
  // -----------------------------------
  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
      } min-h-screen transition-colors duration-300`}
    >
      {/* HEADER */}
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

          {/* Dark mode toggle */}
          <button
            onClick={() => setIsDarkMode((d) => !d)}
            className="px-3 py-2 border rounded-lg text-xs sm:text-sm"
          >
            {isDarkMode ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* TABS */}
      {/* TABS */}
<div className="max-w-5xl mx-auto px-4 py-3">

  {/* Desktop View */}
  <div className="hidden sm:flex gap-3 pb-1">
    {tabs.map((t) => (
      <button
        key={t}
        onClick={() => setActiveTab(t)}
        className={`px-4 py-2 text-sm rounded-full border whitespace-nowrap ${
          activeTab === t
            ? "bg-green-600 text-white border-green-600"
            : isDarkMode
            ? "border-gray-700 text-gray-200"
            : "border-gray-300 text-gray-700"
        }`}
      >
        {t}
      </button>
    ))}
  </div>

  {/* Mobile View (bottom tab bar style) */}
  <div className="sm:hidden flex justify-between border-b border-gray-800">
    <button
      onClick={() => setActiveTab("Hangout & Foods")}
      className={`flex flex-col items-center flex-1 py-3 ${
        activeTab === "Hangout & Foods"
          ? "text-green-500"
          : "text-gray-400"
      }`}
    >
      <Utensils size={20} />
      <span className="text-xs mt-1">Hangout</span>
    </button>

    <button
      onClick={() => setActiveTab("Business")}
      className={`flex flex-col items-center flex-1 py-3 ${
        activeTab === "Business"
          ? "text-green-500"
          : "text-gray-400"
      }`}
    >
      <Building size={20} />
      <span className="text-xs mt-1">Business</span>
    </button>

    <button
      onClick={() => setActiveTab("Events")}
      className={`flex flex-col items-center flex-1 py-3 ${
        activeTab === "Events"
          ? "text-green-500"
          : "text-gray-400"
      }`}
    >
      <Calendar size={20} />
      <span className="text-xs mt-1">Events</span>
    </button>

    <button
      onClick={() => setActiveTab("Others")}
      className={`flex flex-col items-center flex-1 py-3 ${
        activeTab === "Others"
          ? "text-green-500"
          : "text-gray-400"
      }`}
    >
      <MoreHorizontal size={20} />
      <span className="text-xs mt-1">Others</span>
    </button>
  </div>
</div>


      {/* MAIN GRID */}
      <main className="max-w-5xl mx-auto px-4 pb-24">
        {activeTab === "Events" ? (
          <div className="text-center py-20 opacity-80">
            <img
              src="/coming-soon.svg"
              className="w-40 mx-auto mb-4"
              alt="Coming soon"
            />
            <h2 className="text-xl font-semibold">Exciting events are coming!</h2>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 h-40"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {listToShow.map((place) => (
              <article
                key={place.id}
                onClick={() => openPlaceModal(place)}
                className={`rounded-2xl overflow-hidden border ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-800"
                    : "bg-white border-gray-200"
                } shadow-sm hover:shadow-md cursor-pointer transition-shadow`}
              >
                {/* Image */}
                <div className="relative h-44 w-full">
                  <img
                    src={place.image}
                    className="w-full h-full object-cover"
                    alt={place.name}
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/80 dark:bg-gray-800/70 text-xs">
                    {place.price ? `₹${place.price}` : "Open"}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {place.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {place.location || place.category}
                      </p>
                    </div>
                    <StarRow rating={place.rating} />
                  </div>

                  <p className="mt-3 text-xs text-gray-400 line-clamp-2">
                    {place.description || "Popular place to hangout."}
                  </p>

                  <div className="mt-4 flex justify-between items-center gap-2">
                    {/* Directions */}
                    <button
                      className="px-3 py-2 text-xs sm:text-sm border rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDirections(place);
                      }}
                    >
                      Directions
                    </button>

                    {/* Details */}
                    <button
                      className="px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPlaceModal(place);
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

      {/* MODAL POPUP */}
      {isDetailsOpen && selectedPlace && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className={`w-full max-w-md max-h-[90vh] overflow-y-auto p-4 rounded-2xl ${
              isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
            } shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold truncate">
                {selectedPlace.name}
              </h2>
              <button
                onClick={closeModal}
                className="text-xl leading-none px-2"
              >
                ✕
              </button>
            </div>

            {/* Image */}
            <img
              src={selectedPlace.image}
              className="rounded-lg w-full h-48 object-cover"
              alt={selectedPlace.name}
            />

            {/* Info */}
            <p className="mt-3 text-sm text-gray-400">
              {selectedPlace.description || "No description available."}
            </p>

            <p className="mt-3 text-sm">
              <span className="font-semibold">Location: </span>
              {selectedPlace.location || "Unknown"}
            </p>

            {/* Rating Section */}
            <div className="mt-4 border-t border-gray-800 pt-4">
              <h4 className="text-sm font-semibold mb-2">Rating</h4>

              <div className="flex items-center gap-2">
                {/* Clickable stars */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const idx = i + 1;
                  const isPending = pendingRating !== null && pendingRating >= idx;
                  const isCurrent = pendingRating === null && userRating >= idx;

                  return (
                    <svg
                      key={idx}
                      onClick={() => selectRating(idx)}
                      className={`w-6 h-6 cursor-pointer ${
                        isPending || isCurrent
                          ? "text-yellow-400"
                          : "text-gray-500"
                      }`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 .587l3.668 7.431L24 9.748l-6 5.854L19.335 24 12 20.201 4.665 24 6 15.602 0 9.748l8.332-1.73z" />
                    </svg>
                  );
                })}

                <span className="text-sm">
                  {averageRating !== null
                    ? `${averageRating.toFixed(1)} / 5`
                    : "No rating yet"}
                </span>
              </div>

              {/* Submit button only when user has selected a new rating */}
              {pendingRating !== null && (
                <button
                  onClick={submitRating}
                  className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg"
                >
                  Submit Rating
                </button>
              )}

              {/* Info about current rating */}
              {pendingRating === null && userRating > 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  You rated this place {userRating} / 5
                </p>
              )}
            </div>

            {/* Nearby places */}
            {selectedPlace.nearby_places &&
              selectedPlace.nearby_places.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-2">Nearby places</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlace.nearby_places.map((np, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-xs cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={() => {
                          const found = places.find(
                            (p) =>
                              p.name.trim().toLowerCase() ===
                              np.trim().toLowerCase()
                          );
                          if (found) {
                            openPlaceModal(found);
                          } else {
                            window.open(
                              `https://www.google.com/maps?q=${encodeURIComponent(
                                np
                              )}`,
                              "_blank"
                            );
                          }
                        }}
                      >
                        {np}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Actions */}
            <div className="mt-6 flex justify-between items-center gap-3">
              <button
                className="px-4 py-2 text-sm border rounded-lg"
                onClick={() => openDirections(selectedPlace)}
              >
                Directions
              </button>
              <button
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg"
                onClick={() => router.push(`/place/${selectedPlace.id}`)}
              >
                Open full page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


