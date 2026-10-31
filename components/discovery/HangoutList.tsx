"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FeedbackForm from "@/components/FeedbackForm";

interface Place {
  id: string;
  name: string;
  category?: string;
  location?: string;
  image?: string;
  price?: number;
  rating?: number;
  ads?: string;
  ads_url?: string;
  ads_no?: number;
}

interface HangoutListProps {
  hangouts: Place[];
  isDarkMode: boolean;  // <-- add isDarkMode prop here
}

export default function HangoutList({ hangouts, isDarkMode }: HangoutListProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filter banners
  const banners = hangouts
    .filter(
      (p) =>
        p.ads?.toLowerCase().trim() === "yes" &&
        p.ads_url &&
        p.ads_url.trim() !== ""
    )
    .sort((a, b) => (a.ads_no ?? 0) - (b.ads_no ?? 0));

  const nonAdsPlaces = hangouts;

  // Build category list based on non-ads places
  const categories = Array.from(
    new Set(nonAdsPlaces.map((p) => (p.category || "Uncategorized").trim()))
  );
  const allCategories = ["All", ...categories];

  // Filter by selected category if not "All"
  const filteredPlaces =
    selectedCategory === "All"
      ? nonAdsPlaces
      : nonAdsPlaces.filter(
        (p) => (p.category || "Uncategorized").trim() === selectedCategory
      );

  const groupedPlaces = filteredPlaces.reduce<Record<string, Place[]>>(
    (groups, place) => {
      const cat = (place.category || "Uncategorized").trim();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(place);
      return groups;
    },
    {}
  );

  // Auto slide of banners
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPlace = (id: string) => {
    router.push(`/place/${id}`);
  };

  return (
    <div
      className={`flex flex-col gap-12 ${isDarkMode ? "bg-gray-900" : "bg-white"
        } p-6 rounded-md`}
    >
      {/* === Ads Panel */}
      {banners.length > 0 && (
        <>
          {/* <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>Ads Zone</h2> */}
          <div className="relative w-full h-64 md:h-100 rounded-xl overflow-hidden shadow-lg">
            <div
              className="flex transition-transform duration-700 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="w-full flex-shrink-0 cursor-pointer h-full"
                  onClick={() => goToPlace(banner.id)}
                >
                  <img
                    src={banner.ads_url!}
                    alt={banner.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  className={`w-3 h-3 rounded-full ${i === currentSlide ? "bg-green-500" : "bg-gray-400"
                    }`}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
              onClick={() =>
                setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
              }
            >
              ‹
            </button>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % banners.length)
              }
            >
              ›
            </button>
          </div>
        </>
      )}

      {/* === Filter by Category Dropdown */}
      {/* <div className="flex justify-between items-center mb-6"> */}
        {/* <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Hangout & Food Spots</h2> */}
        {/* <select
          className={`px-4 py-2 rounded-md ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
            }`}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select> */}
      {/* </div> */}

      {/* === Grouped Listings */}
      {Object.entries(groupedPlaces).map(([category, places]) => (
        <div key={category}>
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? "text-white" : "text-black"}`}>{category}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {places.map((place) => (
              <div
                key={place.id}
                onClick={() => goToPlace(place.id)}
                className={`group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 ${isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
              >
                <img
                  src={place.image || "/placeholder.jpg"}
                  alt={place.name}
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform"
                />
                <div className={`p-3 space-y-1 ${isDarkMode ? "text-white" : "text-black"}`}>
                  <h4 className="font-semibold truncate group-hover:text-green-400">
                    {place.name}
                  </h4>
                  {place.location && (
                    <p className="text-sm text-gray-400">{place.location}</p>
                  )}
                  {place.price && (
                    <p className="text-sm text-green-400 font-bold">₹{place.price}</p>
                  )}
                  {place.rating && (
                    <p className="text-sm text-yellow-400">⭐ {place.rating.toFixed(1)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Optionally, show a message if nothing to show */}


      {/* === Top Banner Section === */}
      {/* {hangouts.length === 0 ? (
        <div
          className={`w-full relative rounded-2xl overflow-hidden shadow-md mb-10 mt-2 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"
            }`}
        >
          <img
            src="/banner.png"
            alt="Sample Banner"
            className="w-full h-100 sm:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6 sm:px-12">
            <h1 className="text-5xl sm:text-6xl font-bold text-white drop-shadow-lg">
              Thanks for visiting!
              <span className="block sm:hidden"><br /></span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-200 max-w-xl">
              Our Hangout & Foods category is coming soon—stay tuned!
              Meanwhile, explore other categories and share your feedback. We’d love to hear from you!
            </p>
          </div>
</div>

      ) : null} */}



      {hangouts.length === 0 && (
  <div>
    <FeedbackForm isDarkMode={isDarkMode} />
  </div>
)}


      {/* {hangouts.length === 0 ? (
  <div className={`text-center mt-5 text-xl font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>

<p style={{
  fontFamily: 'Arial, sans-serif',
  fontSize: '30px',
  color: '#333',
  lineHeight: '1',
  backgroundColor: '#f9f9f9',
  padding: '15px',
  borderLeft: '4px solid #037325ff',
  borderRadius: '5px'
}}>
  Thanks for visiting!</p>
  <p style={{
  fontFamily: 'Arial, sans-serif',
  fontSize: '15px',
  color: '#333',
  lineHeight: '1.6',
  backgroundColor: '#f9f9f9',
  padding: '15px',
  borderLeft: '4px solid #037325ff',
  borderRadius: '5px'
}}>
Our Hangout & Foods category is coming soon—stay tuned!
Meanwhile, explore other categories and share your feedback. We’d love to hear from you!
</p>


  </div>
) : Object.keys(groupedPlaces).length === 0 ? (
  <div className={`text-center mt-10 text-xl font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
    No hangout or food places found in this category.
  </div>
) : null} */}

    </div>
  );
}
