"use client";

import React from "react";
import { useRouter } from "next/navigation"; // Step 1: import router

interface Place {
  id: string;
  name: string;
  type: string;
  location?: string;
  image?: string;
  start_date?: string;
  end_date?: string;
  price?: number;
}

interface OthersListProps {
  others: Place[];
}

export default function OthersList({ others }: OthersListProps) {
  const router = useRouter(); // Step 2: use router

  const renderPlaces = (places: Place[]) => {
    if (places.length === 0) {
      return <p className="text-gray-400">No results found.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {places.map((place) => (
          <div
            key={place.id}
            onClick={() => router.push(`/place/${place.id}`)} // Step 3: navigate
            className="cursor-pointer bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          >
            {place.image && (
              <img
                src={place.image}
                alt={place.name}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white">{place.name}</h3>
              {place.location && <p className="text-sm text-gray-400">{place.location}</p>}
              {place.start_date && (
                <p className="text-sm text-gray-400 mt-1">
                  Starts: {new Date(place.start_date).toLocaleDateString()}
                </p>
              )}
              {place.price && (
                <p className="text-sm text-purple-400 mt-1 font-bold">₹{place.price}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return <>{renderPlaces(others)}</>;
}
