"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Place {
  id: string;
  name: string;
  type: string;
  category?: string;
  location?: string;
  image?: string;
  start_date?: string;
  end_date?: string;
  price?: number;
}

interface Banner {
  id: string;
  image: string;
  link?: string;
}

type Item = Place | { isBanner: true; banner: Banner };

interface BusinessListProps {
  business: Place[];
  banners: Banner[];
  isDarkMode: boolean; // New prop for theme
}

export default function BusinessList({ business, banners, isDarkMode }: BusinessListProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const handleCardClick = (id: string) => {
    router.push(`/place/${id}`);
  };

  // Group places by category
  const groupByCategory = (places: Place[]) => {
    return places.reduce((groups: Record<string, Place[]>, place) => {
      const category = place.category || "Uncategorized";
      if (!groups[category]) groups[category] = [];
      groups[category].push(place);
      return groups;
    }, {});
  };

  // Build list with random banners inserted
  const buildItemsWithBanners = (places: Place[], banners: Banner[]): Item[] => {
    let items: Item[] = [...places];
    let results: Item[] = [];

    items.forEach((place, index) => {
      results.push(place);

      // 25% chance to insert a banner after a place
      if (Math.random() < 0.25 && banners.length > 0) {
        const randomBanner = banners[Math.floor(Math.random() * banners.length)];
        results.push({ isBanner: true, banner: randomBanner });
      }
    });

    return results;
  };

  // Filter places by selected category
  const filteredPlaces = useMemo(() => {
    if (selectedCategory === "All") return business;
    return business.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, business]);

  const grouped = groupByCategory(filteredPlaces);
  const allCategories = ["All", ...Object.keys(groupByCategory(business))];

  return (
    <div className={`flex flex-col gap-10 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>

      {/* === Top Banner Section === */}
      <div
        className={`w-full relative rounded-2xl overflow-hidden shadow-md mb-6 mt-2 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"
          }`}
      >
        <img
          src="/banner.png"
          alt="Sample Banner"
          className="w-full h-100 sm:h-80 object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6 sm:px-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-white drop-shadow-lg">
            Discover Great Businesses Near You
            {/* <span className="block sm:hidden"><br /></span> */}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-200 max-w-xl">
            Looking for something local? Explore a variety of nearby businesses—from cafes and shops to services and hangout spots—all just around the corner. Start exploring your area now!
          </p>
        </div>
      </div>


      {/* Category Filter */}
      <div className="flex justify-end mb-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={`px-4 py-2 rounded-md border ${isDarkMode
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-gray-100 text-gray-900 border-gray-300"
            }`}
        >
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Render grouped places */}
      {Object.keys(grouped).map((category) => {
        const items = buildItemsWithBanners(grouped[category], banners);

        return (
          <div key={category}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {items.map((item, index) => {
                if ("isBanner" in item && item.isBanner) {
                  return (
                    <div
                      key={`banner-${item.banner.id}-${index}`}
                      className="col-span-2 md:col-span-3"
                    >
                      <img
                        src={item.banner.image}
                        alt="Ad Banner"
                        className="w-full h-40 object-cover rounded-lg cursor-pointer"
                        onClick={() => {
                          if (item.banner.link) router.push(item.banner.link);
                        }}
                      />
                    </div>
                  );
                }

                const place = item as Place;
                return (
                  <div
                    key={place.id}
                    onClick={() => handleCardClick(place.id)}
                    className={`group cursor-pointer rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2
                      ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}
                    `}
                  >
                    <div className="overflow-hidden">
                      {place.image && (
                        <img
                          src={place.image}
                          alt={place.name}
                          className="w-full h-40 md:h-100 object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3
                        className={`text-lg font-semibold transition-colors duration-200 group-hover:text-green-400 ${isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                      >
                        {place.name}
                      </h3>
                      {place.location && (
                        <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm`}>
                          {place.location}
                        </p>
                      )}
                      {place.start_date && (
                        <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm`}>
                          Starts: {new Date(place.start_date).toLocaleDateString()}
                        </p>
                      )}
                      {place.price && (
                        <p className="text-lg text-green-400 font-bold">₹{place.price}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
