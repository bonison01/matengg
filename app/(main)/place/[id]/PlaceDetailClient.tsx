
//Users/apple/Documents/GitHub/testmateng1/app/(main)/place/[id]/PlaceDetailClient.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../PlaceDetail.module.css";
import { CommentsSection } from "./CommentsSection";
import { useDarkMode } from "@/components/DarkModeContext";

interface Place {
  id: string;
  name: string;
  image?: string;
  image_urls?: string[];
  description?: string;
  location?: string;
  features: string[];
  contact?: string;
  type: string;
  price?: number;
  category?: string;
  openingHours?: string;
  nearby_places?: string | string[] | null;
}

export function PlaceDetailClient({ place }: { place: Place }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useDarkMode();

  const fromTab = searchParams.get("fromTab") || "Hangout & Foods";
  const searchQuery = searchParams.get("search") || "";

  const [nearbyPlaces, setNearbyPlaces] = useState<string[]>([]);

  useEffect(() => {
  console.log("Raw nearby_places from place:", place.nearby_places);

  if (!place.nearby_places) {
    setNearbyPlaces([]);
    return;
  }

  try {
    if (typeof place.nearby_places === "string") {
      const parsed = JSON.parse(place.nearby_places);
      console.log("Parsed nearby_places:", parsed);
      if (Array.isArray(parsed)) {
        setNearbyPlaces(parsed);
      } else {
        setNearbyPlaces([]);
      }
    } else if (Array.isArray(place.nearby_places)) {
      setNearbyPlaces(place.nearby_places);
    } else {
      setNearbyPlaces([]);
    }

    // ✅ Add this
    console.log("Final nearbyPlaces state:", nearbyPlaces);

  } catch (error) {
    console.error("Error parsing nearby_places:", error);
    setNearbyPlaces([]);
  }
}, [place.nearby_places]);



  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(
        `/discover?tab=${encodeURIComponent(fromTab)}&search=${encodeURIComponent(searchQuery)}`
      );
    }
  };

  const resolvedImageUrls: string[] = (() => {
    if (place.image_urls && Array.isArray(place.image_urls)) {
      return place.image_urls;
    }
    if (place.image) {
      try {
        const parsed = JSON.parse(place.image);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [place.image];
      }
    }
    return [];
  })();

  return (
    <div
      className={`min-h-screen p-4 pt-20 transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
      }`}
    >
      <button
        onClick={handleBack}
        className={`mb-4 px-4 py-2 rounded transition ${
          isDarkMode
            ? "bg-gray-700 text-white hover:bg-gray-600"
            : "bg-gray-200 text-black hover:bg-gray-300"
        }`}
      >
        ← Back
      </button>

      <div className={styles.container}>
        {/* Left Pane */}
        <div className={styles.leftPane}>
          {/* Place Details */}
          <div className={styles.content}>
            <h1 className={styles.title}>{place.name}</h1>

            {resolvedImageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {resolvedImageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-md"
                  />
                ))}
              </div>
            ) : (
              <div className={styles.noImage}>
                <span>No images available</span>
              </div>
            )}

            <p className={styles.description}>{place.description}</p>

            <p className={styles.detail}>
              <strong>Type:</strong> {place.type}
            </p>

            {place.category && (
              <p className={styles.detail}>
                <strong>Category:</strong> {place.category}
              </p>
            )}

            <p className={styles.detail}>
              <strong>Location:</strong> {place.location}
            </p>

            {place.openingHours && (
              <p className={styles.detail}>
                <strong>Opening Hours:</strong> {place.openingHours}
              </p>
            )}

            {place.contact && (
              <p className={styles.detail}>
                <strong>Contact:</strong>{" "}
                <a
                  href={`mailto:${place.contact}`}
                  className={`${styles.contactLink} ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  {place.contact}
                </a>
              </p>
            )}

            <div>
              <strong>Features:</strong>
              <ul className={styles.featuresList}>
                {place.features.map((feature, i) => (
                  <li key={i} className={styles.featureItem} title={feature}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nearby Places */}
            <div className="mt-6">
              <strong>Nearby Places:</strong>
              {nearbyPlaces.length > 0 ? (
                <ul className="list-disc pl-6 mt-2">
                  {nearbyPlaces.map((nearby, index) => (
                    <li key={index} className="mb-1">
                      {nearby}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="italic text-gray-500 mt-1">
                  No nearby places listed.
                </p>
              )}
            </div>

            {place.contact && (
              <a
                href={`mailto:${place.contact}`}
                className={`${styles.buttonContact} ${
                  isDarkMode
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                Contact Now
              </a>
            )}
          </div>
        </div>

        {/* Right Pane */}
        <div className={styles.rightPane}>
          <CommentsSection placeId={place.id} />
        </div>
      </div>
    </div>
  );
}
