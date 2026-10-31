"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Place {
  id: string;
  name: string;
  type: string;
  description?: string;
  coordinates: [number, number];
  rating?: number;
  openingHours?: string;
  image?: string;
}

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params?.id;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!placeId) return;

    async function fetchPlace() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("id", placeId)
        .single();

      if (error) {
        setError("Failed to load place data.");
        setLoading(false);
        return;
      }

      if (data) {
        setPlace({
          id: data.id,
          name: data.name,
          type: data.type,
          description: data.description,
          coordinates: [data.latitude, data.longitude],
          rating: data.rating,
          openingHours: data.opening_hours,
          image: data.image_url,
        });
      }
      setLoading(false);
    }

    fetchPlace();
  }, [placeId]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !date) {
      alert("Please fill all fields.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("bookings").insert([
      {
        place_id: placeId,
        customer_name: name,
        customer_email: email,
        date: date, // <-- This is the booking date column
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert("Failed to submit booking: " + error.message);
      return;
    }

    alert("Booking successful!");
    router.push("/"); // Redirect after booking success
  };

  if (loading) return <div className="p-4">Loading place details...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!place) return <div className="p-4">Place not found.</div>;

  return (
    <div className="max-w-xl mx-auto p-4 pt-20">
      <h1 className="text-3xl font-bold mb-4">Book: {place.name}</h1>

      {place.image && (
        <img
          src={place.image}
          alt={place.name}
          className="w-full h-64 object-cover rounded mb-4"
        />
      )}

      <p className="mb-2">
        <strong>Type:</strong> {place.type}
      </p>
      {place.rating && <p className="mb-2">Rating: {place.rating}</p>}
      {place.openingHours && <p className="mb-4">Opening Hours: {place.openingHours}</p>}
      {place.description && <p className="mb-4">{place.description}</p>}

      <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
        <Input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />
        <Input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
        />
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.currentTarget.value)}
          required
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Booking..." : "Confirm Booking"}
        </Button>
      </form>
    </div>
  );
}
