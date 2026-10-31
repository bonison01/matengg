"use client";

import { useEffect, useState } from "react";

interface Props {
  onLocationFetched: (coords: [number, number]) => void;
}

export default function GetCurrentLocation({ onLocationFetched }: Props) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        onLocationFetched(coords);
      },
      (err) => {
        console.error(err);
        setError("Unable to retrieve your location. Please enable location access.");
      }
    );
  }, [onLocationFetched]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return null;
}
