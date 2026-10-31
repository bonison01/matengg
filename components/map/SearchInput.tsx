"use client";

import React, { useState, useContext, useEffect, useRef, useCallback, forwardRef } from "react";
import { MapContext } from "../context/MapContext";
import { ScrollArea } from "../ui/scroll-area";
import debounce from "lodash/debounce";

interface SearchInputProps {
  type: "pickup" | "drop";
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({ type }, ref) => {
  const {
    pickup,
    dropoff,
    updatePickup,
    updateDropoff,
    pickupSuggestions,
    dropoffSuggestions,
    updatePickupSuggestions,
    updateDropoffSuggestions,
  } = useContext(MapContext);

  const manipurLocation = { lat: 24.817, lng: 93.936 };

  const [query, setQuery] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPickup = type === "pickup";
  const location = isPickup ? pickup : dropoff;
  const suggestions = isPickup ? pickupSuggestions : dropoffSuggestions;
  const updateSuggestions = isPickup ? updatePickupSuggestions : updateDropoffSuggestions;
  const updateLocation = isPickup ? updatePickup : updateDropoff;

  useEffect(() => {
    if (location?.name) {
      setQuery(location.name);
    } else {
      setQuery(""); 
    }
  }, [location]);

  useEffect(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  }, [suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(
    async (value: string) => {
      if (value.length > 4) {
        const response = await fetch(
          `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
            value
          )}&location=${encodeURIComponent(
            `${manipurLocation.lat},${manipurLocation.lng}`
          )}&radius=300000&api_key=${process.env.NEXT_PUBLIC_OLA_API_KEY}`
        );
        const data = await response.json();
        console.log("Autocomplete API response:", data);
        updateSuggestions(data.predictions || []);
      } else {
        updateSuggestions([]);
      }
    },
    [manipurLocation.lat, manipurLocation.lng, updateSuggestions]
  );

  // Debounce the fetchSuggestions function
  const debouncedFetchSuggestions = useCallback(
    debounce((value: string) => {
      fetchSuggestions(value);
    }, 800),
    [fetchSuggestions]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    debouncedFetchSuggestions(value);
  };

  const handleSelect = async (suggestion: any) => {
    const placeId = suggestion.place_id;
    console.log("Selected placeId:", placeId);

    try {
      const response = await fetch(
        `https://api.olamaps.io/places/v1/details?place_id=${encodeURIComponent(
          placeId
        )}&api_key=${process.env.NEXT_PUBLIC_OLA_API_KEY}`
      );
      const data = await response.json();
      console.log("Place Details API response:", data);

      if (data.status === "ok" && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        if (typeof lat === "number" && typeof lng === "number") {
          updateLocation([lng, lat], data.result.formatted_address || suggestion.description);
          setQuery(data.result.formatted_address || suggestion.description);
        } else {
          console.error("Invalid lat/lng in Place Details response:", data.result.geometry.location);
          throw new Error("Invalid coordinates from Place Details");
        }
      } else {
        console.error("Place Details API failed or no location data:", data);
        throw new Error("No valid location in response");
      }
    } catch (error) {
      console.error("Failed to fetch place details:", error);
      const coords = suggestion.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length === 2) {
        const [lng, lat] = coords;
        updateLocation([lng, lat], suggestion.description);
        setQuery(suggestion.description);
      } else {
        console.error("Fallout coordinates invalid:", suggestion);
      }
    }

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <fieldset className="border-2 border-gray-400/30 rounded-lg text-sm w-84 p-2 pt-0">
        <legend className="text-gray-200/70 capitalize ml-1">{type} location</legend>
        <input
          ref={ref} // Forward the ref to the input element
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full outline-none border-none bg-transparent px-1"
        />
      </fieldset>
      {isOpen && suggestions.length > 0 && (
        <div className="absolute w-84 mt-1 bg-white text-stone-700 border border-gray-300 shadow-md rounded-xl z-50 overflow-y-auto">
          <ScrollArea>
            <div className="h-auto max-h-96 m-2 mr-4">
              <ul className="list-none">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    onClick={() => handleSelect(suggestion)}
                    className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100"
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
});


SearchInput.displayName = 'SearchInput';

export default SearchInput;