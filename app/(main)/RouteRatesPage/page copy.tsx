"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Rate {
  id: string;
  pickup_location: string;
  drop_location: string;
  std_rate: number;
  instant_rate: number;
  light_vehicle_rate: number;
}

export default function RouteRatesPage() {
  const [pickupLocations, setPickupLocations] = useState<string[]>([]);
  const [otherPickupLocations, setOtherPickupLocations] = useState<string[]>([]);
  const [dropLocations, setDropLocations] = useState<string[]>([]);
  const [activePickup, setActivePickup] = useState<string | "others">("");
  const [rates, setRates] = useState<Rate[]>([]);

  // Others tab inputs and suggestions
  const [searchPickup, setSearchPickup] = useState<string>("");
  const [searchDrop, setSearchDrop] = useState<string>("");

  const [filteredPickupSuggestions, setFilteredPickupSuggestions] = useState<string[]>([]);
  const [filteredDropSuggestions, setFilteredDropSuggestions] = useState<string[]>([]);

  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    const { data, error } = await supabase.from("route_rates").select("*");
    if (error) {
      console.error("Error fetching rates:", error.message);
      return;
    }
    if (!data) return;

    setRates(data);

    // Count pickup locations frequency
    const pickupCountMap: Record<string, number> = {};
    data.forEach((r) => {
      pickupCountMap[r.pickup_location] = (pickupCountMap[r.pickup_location] || 0) + 1;
    });

    // Sort by frequency descending
    const sortedPickupLocations = Object.entries(pickupCountMap)
      .sort(([, a], [, b]) => b - a)
      .map(([loc]) => loc);

    // Always take top 2 pickups (even if less than 2)
    const topPickupLocations = sortedPickupLocations.slice(0, 2);

    // All pickups unique
    const allPickupLocations = Array.from(new Set(data.map((r) => r.pickup_location)));

    // Others = all pickups minus top 2
    const others = allPickupLocations.filter((loc) => !topPickupLocations.includes(loc));

    setPickupLocations(topPickupLocations);
    setOtherPickupLocations(others);

    // Initialize active tab to first top pickup or others if no top pickups
    if (topPickupLocations.length > 0) {
      setActivePickup(topPickupLocations[0]);
    } else {
      setActivePickup("others");
    }

    setDropLocations(Array.from(new Set(data.map((r) => r.drop_location))));
  };

  // Filtered rates for top pickup tabs
  const filteredRates = rates
    .filter((r) => r.pickup_location === activePickup)
    .filter((r) =>
      r.drop_location.toLowerCase().includes(searchDrop.toLowerCase())
    );

  // Suggestion handlers for Others tab
  const handleSearchPickupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchPickup(value);
    filterPickupSuggestions(value);
    setSelectedRate(null);
  };

  const handleSearchDropChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchDrop(value);
    filterDropSuggestions(value);
    setSelectedRate(null);
  };

  const filterPickupSuggestions = (searchText: string) => {
    if (!searchText) {
      setFilteredPickupSuggestions([]);
      return;
    }
    // Use all pickups in "Others" tab only
    const filtered = otherPickupLocations.filter((loc) =>
      loc.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredPickupSuggestions(filtered);
  };

  const filterDropSuggestions = (searchText: string) => {
    if (!searchText) {
      setFilteredDropSuggestions([]);
      return;
    }
    const filtered = dropLocations.filter((loc) =>
      loc.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredDropSuggestions(filtered);
  };

  const handlePickupSelect = (pickup: string) => {
    setSearchPickup(pickup);
    setFilteredPickupSuggestions([]);
    filterRatesForSelectedLocations(pickup, searchDrop);
  };

  const handleDropSelect = (drop: string) => {
    setSearchDrop(drop);
    setFilteredDropSuggestions([]);
    filterRatesForSelectedLocations(searchPickup, drop);
  };

  const filterRatesForSelectedLocations = (pickup: string, drop: string) => {
    if (!pickup || !drop) {
      setSelectedRate(null);
      return;
    }

    const filtered = rates.filter(
      (r) =>
        r.pickup_location.toLowerCase() === pickup.toLowerCase() &&
        r.drop_location.toLowerCase() === drop.toLowerCase()
    );

    setSelectedRate(filtered.length > 0 ? filtered[0] : null);
  };

  return (
    <div className="p-6 pt-40 max-w-4xl mx-auto text-gray-200">
      <h1 className="text-2xl font-bold mb-2">Select Your Route</h1>
      <p className="text-gray-400 mb-6">
        Select your pickup points. This is for business only.
      </p>

      <Tabs
        value={activePickup}
        onValueChange={(v) => {
          setActivePickup(v);
          setSearchDrop("");
          setSearchPickup("");
          setSelectedRate(null);
        }}
        className="mb-6"
      >
        <TabsList>
          {/* Show exactly 3 tabs: top 2 pickups + Others */}
          {pickupLocations[0] && (
            <TabsTrigger value={pickupLocations[0]}>{pickupLocations[0]}</TabsTrigger>
          )}
          {pickupLocations[1] && (
            <TabsTrigger value={pickupLocations[1]}>{pickupLocations[1]}</TabsTrigger>
          )}
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>

        {/* Top pickup 1 tab content */}
        {pickupLocations[0] && (
          <TabsContent value={pickupLocations[0]}>
            <div className="mb-4">
              <Input
                placeholder="Search drop location..."
                value={searchDrop}
                onChange={(e) => setSearchDrop(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {filteredRates.length === 0 ? (
              <p className="text-gray-400">No matching drop locations.</p>
            ) : (
              <div className="grid gap-4">
                {filteredRates.map((rate) => (
                  <div
                    key={rate.id}
                    className="bg-gray-800 rounded p-4 shadow-md flex justify-between items-center"
                  >
                    <div>
                      <h2 className="text-lg font-semibold">{rate.drop_location}</h2>
                      <p className="text-sm text-gray-400">Standard: ₹{rate.std_rate}</p>
                      <p className="text-sm text-gray-400">Instant: ₹{rate.instant_rate}</p>
                      <p className="text-sm text-gray-400">Light Vehicle: ₹{rate.light_vehicle_rate}</p>
                    </div>
                    <Button variant="secondary">Book Now</Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Top pickup 2 tab content */}
        {pickupLocations[1] && (
          <TabsContent value={pickupLocations[1]}>
            <div className="mb-4">
              <Input
                placeholder="Search drop location..."
                value={searchDrop}
                onChange={(e) => setSearchDrop(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {filteredRates.length === 0 ? (
              <p className="text-gray-400">No matching drop locations.</p>
            ) : (
              <div className="grid gap-4">
                {filteredRates.map((rate) => (
                  <div
                    key={rate.id}
                    className="bg-gray-800 rounded p-4 shadow-md flex justify-between items-center"
                  >
                    <div>
                      <h2 className="text-lg font-semibold">{rate.drop_location}</h2>
                      <p className="text-sm text-gray-400">Standard: ₹{rate.std_rate}</p>
                      <p className="text-sm text-gray-400">Instant: ₹{rate.instant_rate}</p>
                      <p className="text-sm text-gray-400">Light Vehicle: ₹{rate.light_vehicle_rate}</p>
                    </div>
                    <Button variant="secondary">Book Now</Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Others tab */}
        <TabsContent value="others">
          <div className="mb-4">
            <Input
              placeholder="Enter Pickup Point..."
              value={searchPickup}
              onChange={handleSearchPickupChange}
              className="bg-gray-800 border-gray-700 text-white mb-2"
              autoComplete="off"
            />
            {filteredPickupSuggestions.length > 0 && (
              <div className="bg-gray-800 rounded max-h-40 overflow-y-auto mb-4">
                {filteredPickupSuggestions.map((pickup) => (
                  <div
                    key={pickup}
                    className="p-2 cursor-pointer hover:bg-gray-700"
                    onClick={() => handlePickupSelect(pickup)}
                  >
                    {pickup}
                  </div>
                ))}
              </div>
            )}

            <Input
              placeholder="Enter Delivery Point..."
              value={searchDrop}
              onChange={handleSearchDropChange}
              className="bg-gray-800 border-gray-700 text-white"
              autoComplete="off"
            />
            {filteredDropSuggestions.length > 0 && (
              <div className="bg-gray-800 rounded max-h-40 overflow-y-auto mt-1 mb-4">
                {filteredDropSuggestions.map((drop) => (
                  <div
                    key={drop}
                    className="p-2 cursor-pointer hover:bg-gray-700"
                    onClick={() => handleDropSelect(drop)}
                  >
                    {drop}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedRate ? (
            <div className="bg-gray-800 rounded p-4 shadow-md">
              <h2 className="text-lg font-semibold">{selectedRate.drop_location}</h2>
              <p className="text-sm text-gray-400">Standard: ₹{selectedRate.std_rate}</p>
              <p className="text-sm text-gray-400">Instant: ₹{selectedRate.instant_rate}</p>
              <p className="text-sm text-gray-400">Light Vehicle: ₹{selectedRate.light_vehicle_rate}</p>
              <Button variant="secondary">Book Now</Button>
            </div>
          ) : (
            <p className="text-gray-400">No matching rates found for your route.</p>
          )}
        </TabsContent>
      </Tabs>

      <footer className="mt-8 p-4 bg-gray-900 text-center text-gray-400">
        <p>&copy; 2025 Your Business Name. All rights reserved.</p>
        <p className="text-sm">This service is intended for business clients only.</p>
      </footer>
    </div>
  );
}
