'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { Place } from "../app/types/place";

interface BookingFormProps {
  place: Place;
}

export default function BookingForm({ place }: BookingFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    address: "",
    whatsapp: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("booking").insert([
      {
        name: form.name,
        address: form.address,
        whatsapp: form.whatsapp,
        email: form.email,
        place_id: place.id,
      },
    ]);

    if (error) {
      console.error("Error submitting booking:", error.message);
      alert("Failed to submit booking. Try again.");
      setLoading(false);
    } else {
      router.push("/booking/confirmation");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg mt-10 space-y-4"
    >
      <h2 className="text-white text-xl font-semibold text-center">
        Book: {place.name}
      </h2>

      <input
        type="text"
        placeholder="Your Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400"
        required
      />
      <input
        type="text"
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400"
        required
      />
      <input
        type="tel"
        placeholder="WhatsApp Number"
        value={form.whatsapp}
        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
        className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400"
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold transition duration-300"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Confirm Booking"}
      </button>
    </form>
  );
}
