"use client";

import React, { useEffect, useState, useContext, useRef, Dispatch, SetStateAction, useCallback } from "react";
import { MapContext } from "../context/MapContext";
import SearchInput from "./SearchInput";
import { calculatePrice } from "@/lib/calculatePrice";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface Location {
  coords: [number, number];
  name: string;
}

interface DistanceMatrixComponentProps {
  onDataUpdate?: (data: {
    pickup: Location | null;
    dropoff: Location | null;
    distance: number | null;
    time: string | null;
    price: string | null;
  }) => void;
  onBookService?: () => void;
  // Define the new props for selectedVehicle and its setter function
  selectedVehicle: 'two-wheeler' | 'light-vehicle';
  onSelectVehicle: Dispatch<SetStateAction<'two-wheeler' | 'light-vehicle'>>;
}

const decodePolyline = (encoded: string) => {
  let points: number[][] = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
};

const DistanceMatrixComponent: React.FC<DistanceMatrixComponentProps> = ({ onDataUpdate, onBookService, selectedVehicle, onSelectVehicle }) => {
  const { pickup, dropoff, updatePickup, updateDropoff } = useContext(MapContext);
  const [map, setMap] = useState<any>(null);
  const [olaMapsInstance, setOlaMapsInstance] = useState<any>(null);
  const [pickupMarker, setPickupMarker] = useState<any>(null);
  const [dropoffMarker, setDropoffMarker] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [geolocate, setGeolocate] = useState<any>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);

  const prevDataRef = useRef<{
    pickup: Location | null;
    dropoff: Location | null;
    distance: number | null;
    time: string | null;
    price: string | null;
  }>({
    pickup: null,
    dropoff: null,
    distance: null,
    time: null,
    price: null,
  });

  const manipurLocation = { lat: 24.817, lng: 93.936 };

  const reverseGeocode = async (lng: number, lat: number) => {
    const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${process.env.NEXT_PUBLIC_OLA_API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "ok" && data.results?.length > 0) {
        return data.results[0].formatted_address;
      }
      return "Unknown Location";
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return "Unknown Location";
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationPermission(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
        if (!pickup) {
          const name = await reverseGeocode(position.coords.longitude, position.coords.latitude);
          updatePickup(userLocation, name);
        }
        setLocationPermission(true);
        setLocationError(null);
      },
      (error) => {
        setLocationPermission(false);
        setLocationError("Location access denied. Please allow location access or set pickup manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [pickup, updatePickup]);

  useEffect(() => {
    const loadSDK = async () => {
      try {
        setIsMapLoading(true);
        const { OlaMaps } = await import("olamaps-web-sdk");
        const olaMaps = new OlaMaps({ apiKey: process.env.NEXT_PUBLIC_OLA_API_KEY! });
        setOlaMapsInstance(olaMaps);

        const myMap = olaMaps.init({
          style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
          container: "map",
          center: [manipurLocation.lng, manipurLocation.lat],
          zoom: 15,
        });

        myMap.on("load", () => {
          const geolocateControl = olaMaps.addGeolocateControls({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false,
          });
          myMap.addControl(geolocateControl);
          setGeolocate(geolocateControl);
          if (locationPermission) geolocateControl.trigger();
          setIsMapLoading(false);
        });

        myMap.on("error", (e: any) => {
          console.error("Map error:", e);
          setIsMapLoading(false);
        });

        setMap(myMap);
      } catch (error) {
        console.error("Failed to initialize map:", error);
        setIsMapLoading(false);
      }
    };

    if (locationPermission !== null) loadSDK();
  }, [locationPermission]);

  useEffect(() => {
    if (!geolocate) return;

    geolocate.on("geolocate", async (event: GeolocationPosition) => {
      const userLocation: [number, number] = [event.coords.longitude, event.coords.latitude];
      if (!pickup) {
        const name = await reverseGeocode(event.coords.longitude, event.coords.latitude);
        updatePickup(userLocation, name);
      }
    });

    geolocate.on("error", () => {
      setLocationError("Unable to retrieve your location.");
    });

    return () => {
      geolocate.off("geolocate");
      geolocate.off("error");
    };
  }, [geolocate, pickup, updatePickup]);

  useEffect(() => {
    if (!map) return;

    const handleClick = async (e: any) => {
      const { lng, lat } = e.lngLat;
      const location: [number, number] = [lng, lat];
      const name = await reverseGeocode(lng, lat);
      if (!pickup) {
        updatePickup(location, name);
      } else if (!dropoff) {
        updateDropoff(location, name);
      }
    };

    map.on("click", handleClick);
    return () => map.off("click", handleClick);
  }, [map, pickup, dropoff, updatePickup, updateDropoff]);

  useEffect(() => {
    if (map && olaMapsInstance && pickup && !pickupMarker) {
      const marker = olaMapsInstance
        .addMarker({ offset: [0, 0], anchor: "center", color: "red", draggable: true })
        .setLngLat(pickup.coords)
        .addTo(map);
      setPickupMarker(marker);

      marker.on("dragend", async (e: any) => {
        const { lng, lat } = marker.getLngLat();
        const name = await reverseGeocode(lng, lat);
        updatePickup([lng, lat], name);
      });

      map.setCenter(pickup.coords);
      map.setZoom(15);
    } else if (pickupMarker && pickup) {
      pickupMarker.setLngLat(pickup.coords);

      if (!dropoff) {
        map.setCenter(pickup.coords);
        map.setZoom(15);
      }
    }
  }, [map, olaMapsInstance, pickup, pickupMarker, updatePickup, dropoff]);

  useEffect(() => {
    if (map && olaMapsInstance && pickup && dropoff && !dropoffMarker) {
      const marker = olaMapsInstance
        .addMarker({ offset: [0, 0], anchor: "center", color: "green", draggable: true })
        .setLngLat(dropoff.coords)
        .addTo(map);
      setDropoffMarker(marker);

      marker.on("dragend", async (e: any) => {
        const { lng, lat } = marker.getLngLat();
        const name = await reverseGeocode(lng, lat);
        updateDropoff([lng, lat], name);
      });

      map.setCenter(dropoff.coords);
      map.setZoom(15);
    } else if (dropoffMarker && dropoff) {
      dropoffMarker.setLngLat(dropoff.coords);
    }
  }, [map, olaMapsInstance, pickup, dropoff, dropoffMarker, updateDropoff]);

  const fetchAndUpdateRoute = useCallback(async () => {
    if (!map || !pickup || !dropoff) {
      setDistance(null);
      setTime(null);
      setPrice(null);
      if (onDataUpdate) {
        const newData = { pickup: null, dropoff: null, distance: null, time: null, price: null };
        onDataUpdate(newData);
        prevDataRef.current = newData;
      }
      if (map && map.getLayer("route")) map.removeLayer("route");
      if (map && map.getSource("route")) map.removeSource("route");
      return;
    }

    if (map.getLayer("route")) map.removeLayer("route");
    if (map.getSource("route")) map.removeSource("route");

    const origins = `${pickup.coords[1]},${pickup.coords[0]}`;
    const destinations = `${dropoff.coords[1]},${dropoff.coords[0]}`;
    const url = `https://api.olamaps.io/routing/v1/distanceMatrix/basic?origins=${encodeURIComponent(
      origins
    )}&destinations=${encodeURIComponent(destinations)}&api_key=${process.env.NEXT_PUBLIC_OLA_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "X-Request-Id": "distance-matrix-" + Date.now() },
      });
      const data = await response.json();

      if (data.status === "SUCCESS" && data.rows?.[0]?.elements?.[0]?.status === "OK") {
        const element = data.rows[0].elements[0];
        const distanceInKm = element.distance / 1000;
        const timeValue = `${Math.round(element.duration / 60)} mins`;
        const priceValue = `${calculatePrice(distanceInKm, selectedVehicle).toFixed(2)}`;

        setDistance(distanceInKm);
        setTime(timeValue);
        setPrice(priceValue);

        const newData = { pickup, dropoff, distance: distanceInKm, time: timeValue, price: priceValue };
        const prevData = prevDataRef.current;
        if (onDataUpdate && JSON.stringify(newData) !== JSON.stringify(prevData)) {
          onDataUpdate(newData);
          prevDataRef.current = newData;
        }

        if (element.polyline) {
          const coordinates = decodePolyline(element.polyline);
          map.addSource("route", {
            type: "geojson",
            data: { type: "Feature", geometry: { type: "LineString", coordinates } },
          });
          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#3887be", "line-width": 5 },
          });

          let minLng = Math.min(pickup.coords[0], dropoff.coords[0]);
          let maxLng = Math.max(pickup.coords[0], dropoff.coords[0]);
          let minLat = Math.min(pickup.coords[1], dropoff.coords[1]);
          let maxLat = Math.max(pickup.coords[1], dropoff.coords[1]);

          coordinates.forEach(([lng, lat]) => {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          });

          const bounds: [[number, number], [number, number]] = [
            [minLng, minLat],
            [maxLng, maxLat],
          ];

          map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15,
            duration: 1000,
          });
        }
      } else {
        setDistance(null);
        setTime("N/A");
        setPrice("N/A");
        if (onDataUpdate) {
          const newData = { pickup, dropoff, distance: null, time: "N/A", price: "N/A" };
          const prevData = prevDataRef.current;
          if (JSON.stringify(newData) !== JSON.stringify(prevData)) {
            onDataUpdate(newData);
            prevDataRef.current = newData;
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch distance matrix:", error);
      setDistance(null);
      setTime("Error");
      setPrice("Error");
      if (onDataUpdate) {
        const newData = { pickup, dropoff, distance: null, time: "Error", price: "Error" };
        const prevData = prevDataRef.current;
        if (JSON.stringify(newData) !== JSON.stringify(prevData)) {
          onDataUpdate(newData);
          prevDataRef.current = newData;
        }
      }
    }
  }, [map, pickup, dropoff, onDataUpdate, selectedVehicle]);

  useEffect(() => {
    fetchAndUpdateRoute();
  }, [fetchAndUpdateRoute]);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 h-full">
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 sm:gap-4 md:w-84">
          <div className="flex flex-col gap-6">
            <SearchInput type="pickup" ref={pickupInputRef} />
            <SearchInput type="drop" ref={dropoffInputRef} />
          </div>

          <div className="mt-4 flex justify-center">
            {pickup && dropoff ? (
              <Card className="w-full">
                <CardHeader>
                  <CardDescription>
                    <strong># Disclaimer:</strong> Distance and price are approximate estimates from map
                    calculations, and actual values may vary.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-row gap-2 mb-4">
                    <Button
                      variant={selectedVehicle === 'two-wheeler' ? 'default' : 'secondary'}
                      onClick={() => onSelectVehicle('two-wheeler')}
                    >
                      Two-Wheeler
                    </Button>
                    <Button
                      variant={selectedVehicle === 'light-vehicle' ? 'default' : 'secondary'}
                      onClick={() => onSelectVehicle('light-vehicle')}
                    >
                      Light Vehicle
                    </Button>
                  </div>
                  <div className="flex flex-row gap-2">
                    <Label className="text-base text-zinc-300 font-bold">Distance:</Label>
                    <span className="text-lg text-green-400 font-semibold">
                      {distance !== null ? `${distance.toFixed(1)} km` : "Calculating..."}
                    </span>
                  </div>
                  <div className="flex flex-row gap-2">
                    <Label className="text-base text-zinc-300 font-bold">Cost:</Label>
                    <span className="text-lg text-green-400 font-semibold">{`₹ ${price}` || "Calculating..."}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="text-white w-full"
                    onClick={() => onBookService && onBookService()}
                    disabled={!pickup || !dropoff}
                  >
                    Booked Service
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <CardDescription className="px-2">
                Select pick-up and drop-off locations to see distance, time, and price.<br /><br />
                This rate is valid only in the Imphal area. For assistance outside Imphal, please contact our support team at: 8787649928.
              </CardDescription>
            )}
          </div>
        </div>
        <div className="flex-1 px-2">
          {isMapLoading && <Skeleton className="w-full h-[480px]" />}
          <div id="map" style={{ width: "100%", height: "480px" }} />
        </div>
      </div>
    </>
  );
};

export default DistanceMatrixComponent;