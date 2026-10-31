"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import EventHero from "@/components/events/EventHero";
import EventCategoryIcons from "@/components/events/EventCategoryIcons";

interface Event {
  id: string;
  name: string;
  location?: string;
  start_date: string;
  end_date: string;
  price: number;
  image: string;
}

export default function EventsTabView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("type", "event");

    if (error) {
      console.error("Error fetching events:", error);
      return;
    }

    const parsedEvents: Event[] = (data || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      location: e.location,
      start_date: e.start_date,
      end_date: e.end_date,
      price: e.price,
      image: e.image_url || "/placeholder.jpg",
    }));

    setEvents(parsedEvents);

    // Featured event logic
    const main = parsedEvents.find((e) => e.name === "Echoes of Earth, 2025");
    setFeaturedEvent(main || parsedEvents[0] || null);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filtered = events.filter(
    (e) =>
      e.id !== featuredEvent?.id &&
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pt-10">
      {/* Search */}
      <div className="relative w-full sm:w-1/2">
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-gray-200"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
      </div>

      {/* Hero Event */}
      {featuredEvent && (
        <EventHero event={featuredEvent} />
      )}

      {/* Category Icons */}
      <EventCategoryIcons />

      {/* Other Events */}
      {filtered.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Other Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="bg-gray-800 rounded-lg shadow-lg p-4"
              >
                <h3 className="text-lg font-semibold text-white">{event.name}</h3>
                <p className="text-sm text-gray-400">{event.location}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Date: {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
