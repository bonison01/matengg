"use client";

import React from "react";

interface Place {
  id: string;
  name: string;
  image?: string;
  description?: string;
  location?: string;
  rating?: number;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: [number, number];
  contact?: string;
  price?: number;
}

export default function PlaceDetailsModal({
  place,
  onClose,
  isDark,
}: {
  place: Place;
  onClose: () => void;
  isDark: boolean;
}) {
  if (!place) return null;

  const lat = place.latitude ?? place.coordinates?.[0];
  const lng = place.longitude ?? place.coordinates?.[1];

  const openDirections = () => {
    if (!lat || !lng) return alert("Location not available");
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className={`relative w-full md:w-2/3 max-w-xl rounded-t-2xl md:rounded-2xl shadow-lg p-4 overflow-auto ${
          isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        <h2 className="text-lg font-semibold">{place.name}</h2>
        <p className="text-sm text-gray-400">{place.location}</p>

        <img
          src={place.image || "/placeholder.jpg"}
          className="w-full h-48 object-cover rounded-lg mt-3"
          alt={place.name}
        />

        <p className="text-sm mt-3 text-gray-300">
          {place.description || "No description available."}
        </p>

        <div className="text-xs mt-4 space-y-1 opacity-80">
          <div>Rating: {place.rating ?? "-"}</div>
          <div>Opening Hours: {place.openingHours ?? "N/A"}</div>
          <div>Contact: {place.contact ?? "N/A"}</div>
          <div>Price: {place.price ? `₹${place.price}` : "N/A"}</div>
        </div>

        <button
          onClick={openDirections}
          className="mt-4 px-4 py-2 border rounded-lg w-full"
        >
          Directions
        </button>

        <button
          onClick={onClose}
          className="mt-3 px-4 py-2 border rounded-lg w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}
