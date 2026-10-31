"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer/Footer";
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
  const [activePickup, setActivePickup] = useState<string>("");
  const [rates, setRates] = useState<Rate[]>([]);
  const [searchDrop, setSearchDrop] = useState<string>("");
  const [searchPickup, setSearchPickup] = useState<string>("");
  const [filteredRates, setFilteredRates] = useState<Rate[]>([]);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    const { data, error } = await supabase.from("route_rates").select("*");
    if (error) {
      console.error("Error fetching rates:", error.message);
      return;
    }

    const uniquePickupLocations = Array.from(
      new Set(data.map((r) => r.pickup_location))
    );

    setPickupLocations(uniquePickupLocations);
    setActivePickup(uniquePickupLocations[0]);
    setRates(data);
  };

  // Function to filter rates based on both Pickup and Delivery locations
  const filterRatesForOthers = () => {
    const filtered = rates.filter(
      (r) =>
        r.pickup_location.toLowerCase().includes(searchPickup.toLowerCase()) &&
        r.drop_location.toLowerCase().includes(searchDrop.toLowerCase())
    );
    setFilteredRates(filtered);
  };

  // Handle input change for Pickup location
  const handleSearchPickupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPickup(e.target.value);
    filterRatesForOthers();
  };

  // Handle input change for Drop location
  const handleSearchDropChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchDrop(e.target.value);
    filterRatesForOthers();
  };

  // Filtered rates for selected pickup location tab
  const filteredRatesForTab = rates
    .filter((r) => r.pickup_location === activePickup)
    .filter((r) =>
      r.drop_location.toLowerCase().includes(searchDrop.toLowerCase())
    );

  return (
    <div className="p-6 pt-20 max-w-4xl mx-auto text-gray-200">
      <h1 className="text-5xl font-bold mb-4">STANDARD RATES</h1>
      <h2 className="text-2xl mb-4">Select your pickup points. This is for business only.</h2>
      {/* <p className="text-gray-400 mb-6">
        This is for business only.
      </p> */}

      {/* Tabs */}
      <Tabs
        defaultValue={activePickup}
        onValueChange={(v) => setActivePickup(v)}
        className="mb-6"
      >
        <TabsList>
          {pickupLocations.map((loc) => (
            <TabsTrigger key={loc} value={loc}>
              {loc}
            </TabsTrigger>
          ))}
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>

        {/* Pickup Locations Tab */}
        {pickupLocations.map((loc) => (
          <TabsContent key={loc} value={loc}>
            <div className="mb-4">
              <Input
                placeholder="Search drop location..."
                value={searchDrop}
                onChange={(e) => setSearchDrop(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {filteredRatesForTab.length === 0 ? (
              <p className="text-gray-400">No matching drop locations.</p>
            ) : (
              <div className="grid gap-4">
                {filteredRatesForTab.map((rate) => (
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
                    {/* <Button variant="secondary">Book Now</Button> */}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}

        {/* "Others" Tab */}
        <TabsContent value="others">
          <div className="mb-4">
            <Input
              placeholder="Enter Pickup Point..."
              value={searchPickup}
              onChange={handleSearchPickupChange}
              className="bg-gray-800 border-gray-700 text-white mb-4"
            />
            <Input
              placeholder="Enter Delivery Point..."
              value={searchDrop}
              onChange={handleSearchDropChange}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {filteredRates.length === 0 ? (
            <p className="text-gray-400">No matching rates found for your route.</p>
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
      </Tabs>


      {/* Footer */}
      <div className="w-full min-h-90"></div>
      <Footer  />
      {/* <footer className="mt-8 p-4 bg-gray-900 text-center text-gray-400">
        <p>&copy; 2025 Your Business Name. All rights reserved.</p>
        <p className="text-sm">This service is intended for business clients only.</p>
      </footer> */}
    </div>
  );
}
