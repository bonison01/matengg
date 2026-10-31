"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "@/lib/supabaseClient";
import EventHero from "@/components/events/EventHero";
import EventCategoryIcons from "@/components/events/EventCategoryIcons";
import BusinessList from "@/components/discovery/BusinessList";
import OthersList from "@/components/discovery/OthersList";
import HangoutList from "@/components/discovery/HangoutList";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";

interface Place {
  id: string;
  name: string;
  type: string;
  category?: string;
  coordinates: [number, number];
  distance?: number;
  rating?: number;
  openingHours?: string;
  image?: string;
  image_urls?: string[];
  description?: string;
  contact?: string;
  start_date?: string;
  end_date?: string;
  price?: number;
  location?: string;
  features: string[];
  nearby_places?: string | string[];
  ads?: string;
  ads_url?: string;
  ads_no?: number;
}

interface Banner {
  id: string;
  image: string;
  link?: string;
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-400 dark:bg-gray-600 peer-checked:bg-green-600 transition"></div>
      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
        {checked ? "Dark" : "Light"}
      </span>
    </label>
  );
}

export default function DiscoverPageContent() {
  const dispatch = useDispatch();
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeTab, setActiveTab] = useState<"Business" | "Events" | "Others" | "Hangout & Foods">(
    "Hangout & Foods"
  );
  const [isDarkMode, setIsDarkMode] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["Hangout & Foods", "Business", "Events", "Others"].includes(tabParam)) {
      setActiveTab(tabParam as typeof activeTab);
    }
  }, [searchParams]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState(null, "", url.toString());
  }, [activeTab]);

  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  const fetchPlaces = async (lat?: number, lng?: number) => {
    try {
      const { data, error } = await supabase.from("places").select("*");
      if (error) {
        console.error("Supabase fetch error:", error);
        return;
      }

      const placesData: Place[] = (data ?? []).map((p: any) => {
        let distance;
        if (lat !== undefined && lng !== undefined) {
          distance = getDistanceFromLatLonInKm(lat, lng, p.latitude, p.longitude);
        }

        const imageArray = (() => {
          try {
            const parsed = JSON.parse(p.image_url);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return typeof p.image_url === "string" ? [p.image_url] : [];
          }
        })();

        return {
          id: p.id,
          name: p.name,
          type: p.type,
          category: p.category,
          coordinates: [p.latitude, p.longitude],
          distance,
          rating: p.rating,
          openingHours: p.opening_hours ?? "",
          image: imageArray[0] || "/placeholder.jpg",
          image_urls: imageArray,
          description: p.description,
          contact: p.contact,
          start_date: p.start_date,
          end_date: p.end_date,
          price: p.price,
          location: p.location,
          features: Array.isArray(p.features) ? p.features : [],
          nearby_places:
            typeof p.nearby_places === "string"
              ? p.nearby_places.split(",").map((x: string) => x.trim())
              : Array.isArray(p.nearby_places)
              ? p.nearby_places
              : [],
          ads: p.ads,
          ads_url: p.ads_url,
          ads_no: p.ads_no,
        };
      });

      setPlaces(placesData);
    } catch (err) {
      console.error("Unexpected error in fetchPlaces:", err);
    }
  };

  // Improved fetchBanners with verbose error logging and explicit columns
  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("id, image_url, link");
      
      console.log("Banners data:", data, "Error:", error);
      
      if (error) {
        console.error("Error fetching banners:", JSON.stringify(error, null, 2));
        return;
      }

      if (!data || data.length === 0) {
        console.warn("No banners found in the database.");
        return;
      }

      const formattedBanners: Banner[] = data.map((b: any) => ({
        id: b.id,
        image: b.image_url,
        link: b.link,
      }));

      setBanners(formattedBanners);
    } catch (err) {
      console.error("Banner fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchBanners();

    if (!navigator.geolocation) {
      fetchPlaces();
      setLocationDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
        fetchPlaces(latitude, longitude);
      },
      (error) => {
        console.warn("Location access denied:", error.message);
        setLocationDenied(true);
        fetchPlaces();
      }
    );
  }, []);

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const events = filteredPlaces.filter((p) => p.type.trim().toLowerCase() === "event");
  const business = filteredPlaces.filter((p) => p.type.trim().toLowerCase() === "business");
  const others = filteredPlaces.filter((p) => {
    const t = p.type.trim().toLowerCase();
    return t !== "event" && t !== "business";
  });

  const hangouts = filteredPlaces.filter((p) => {
    const cat = (p.category || "").trim().toLowerCase();
    const isHangoutOrFood = cat.includes("hangout") || cat.includes("food");
    const isNotEvent = p.type.trim().toLowerCase() !== "event";
    return isHangoutOrFood && isNotEvent;
  });

  const featuredEvent = events.find((e) => e.name === "Echoes of Earth, 2025") || events[0];

  return (
    <div
      className={`min-h-screen pt-10 px-4 ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
      }`}
    >
      <div className="w-full mx-auto flex flex-col gap-6">
        <div
          className={`sticky top-[3.75rem] z-30 pb-4 ${
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`flex flex-wrap items-center justify-between gap-4 border-b pb-2 ${
              isDarkMode ? "border-gray-700" : "border-gray-300"
            }`}
          >
            <div className="flex flex-wrap gap-4">
              {["Hangout & Foods", "Business", "Events", "Others"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`relative pb-2 text-sm sm:text-base font-medium transition-colors duration-200 ${
                      isActive
                        ? isDarkMode
                          ? "text-white"
                          : "text-green-600"
                        : isDarkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-green-600"
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <span
                        className={`absolute left-0 bottom-0 w-full h-0.5 rounded-full ${
                          isDarkMode ? "bg-green-500" : "bg-green-600"
                        }`}
                      ></span>
                    )}
                  </button>
                );
              })}
            </div>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        <Switch checked={isDarkMode} onChange={setIsDarkMode} />

        <div className="w-full mt-0">
          {activeTab === "Events" ? (
            <>
              <EventCategoryIcons />
              {events.length === 0 ? (
                <div className="text-center mt-10 text-gray-400">
                  <img src="/coming-soon.svg" className="w-32 h-32 mx-auto" />
                  <h2 className="text-2xl font-bold">Coming Soon!</h2>
                  <p>We’re working on bringing exciting events to your area.</p>
                </div>
              ) : (
                <>
                  {featuredEvent && (
                    <EventHero
                      event={{
                        id: featuredEvent.id,
                        name: featuredEvent.name,
                        location: featuredEvent.location,
                        start_date: featuredEvent.start_date ?? "",
                        end_date: featuredEvent.end_date ?? "",
                        price: featuredEvent.price ?? 0,
                        image: featuredEvent.image ?? "/placeholder.jpg",
                      }}
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                    {events
                      .filter((e) => e.id !== featuredEvent?.id)
                      .map((event) => (
                        <div
                          key={event.id}
                          className={`p-4 rounded-xl shadow-md ${
                            isDarkMode ? "bg-gray-800" : "bg-gray-100"
                          }`}
                        >
                          <img
                            src={event.image || "/placeholder.jpg"}
                            alt={event.name}
                            className="w-full h-40 object-cover rounded-md mb-2"
                          />
                          <h3 className="text-lg font-semibold">{event.name}</h3>
                          <p className="text-sm">
                            {event.start_date
                              ? new Date(event.start_date).toLocaleDateString()
                              : "TBA"}
                          </p>
                          <p className="text-xs text-gray-400">Type: {event.type}</p>
                          <p className="text-xs text-gray-400">Category: {event.category}</p>
                          <p className="text-xs text-gray-400">
                            Opening Hours: {event.openingHours || "N/A"}
                          </p>
                          {Array.isArray(event.image_urls) && event.image_urls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {event.image_urls.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`img-${idx}`}
                                  className="w-14 h-14 rounded object-cover"
                                />
                              ))}
                            </div>
                          )}
                          {event.nearby_places && event.nearby_places.length > 0 && (
                            <div className="text-xs text-gray-500 mt-2">
                              Nearby: {(event.nearby_places as string[]).join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </>
              )}
            </>
          ) : activeTab === "Business" ? (
            <BusinessList business={business} banners={banners} isDarkMode={isDarkMode} />
          ) : activeTab === "Hangout & Foods" ? (
            <HangoutList hangouts={hangouts} isDarkMode={isDarkMode} />
          ) : (
            <OthersList others={others} />
          )}
        </div>
      </div>
    </div>
  );
}
