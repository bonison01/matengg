"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../ui/input";
import { LocateFixed, Search } from "lucide-react";
import GetCurrentLocation from "@/components/map/GetCurrentLocation";

interface Place {
  id: string;
  name: string;
  type: string;
  coordinates: [number, number];
  distance?: number; // km
  rating?: number;
  openingHours?: string;
  image?: string;
}

export default function DiscoverPage() {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);

  // Triggered after obtaining user location
  useEffect(() => {
    if (currentLocation) {
      // TODO: Replace with real API — passing location, search, etc.
      const mock: Place[] = [
        {
          id: "1",
          name: "City Park",
          type: "Parks",
          coordinates: [currentLocation[0] + 0.01, currentLocation[1] + 0.01],
          distance: 1.5,
          rating: 4.6,
          openingHours: "6 AM – 9 PM",
          image: "/images/park.jpg",
        },
        {
          id: "2",
          name: "Chai Point",
          type: "Hangouts",
          coordinates: [currentLocation[0] + 0.005, currentLocation[1] + 0.005],
          distance: 0.8,
          rating: 4.2,
          openingHours: "9 AM – 10 PM",
          image: "/images/chaipoint.jpg",
        },
      ];
      setPlaces(mock);
      setFilteredPlaces(mock);
    }
  }, [currentLocation]);

  // Search filter
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPlaces(places);
    } else {
      setFilteredPlaces(
        places.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, places]);

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-gray-200">
      <GetCurrentLocation onLocationFetched={setCurrentLocation} />

      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Discover Nearby</h1>
          <Button variant="outline">
            <LocateFixed className="mr-2" size={16} />
            Near Me
          </Button>
        </div>

        <div className="relative max-w-md w-full">
          <Input
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2" size={16} />
        </div>

        {currentLocation ? (
          <>
            {/* MapView removed */}

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredPlaces.map((place) => (
                <div
                  key={place.id}
                  className="bg-gray-800 rounded-lg p-4 flex flex-col"
                >
                  {place.image && (
                    <img
                      src={place.image}
                      alt={place.name}
                      className="h-32 object-cover rounded-md mb-2"
                    />
                  )}
                  <h3 className="text-lg font-semibold">{place.name}</h3>
                  {place.distance && (
                    <p className="text-sm">Distance: {place.distance.toFixed(1)} km</p>
                  )}
                  {place.rating && (
                    <p className="text-sm">Rating: {place.rating}</p>
                  )}
                  {place.openingHours && (
                    <p className="text-sm">{place.openingHours}</p>
                  )}
                  <Button className="mt-auto">Navigate</Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-8 text-center">Fetching your location...</p>
        )}
      </div>
    </div>
  );
}
