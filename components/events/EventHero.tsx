// components/events/EventHero.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // Import router

interface EventHeroProps {
  event: {
    id: string; // <-- Add this line
    name: string;
    location?: string;
    start_date: string;
    end_date: string;
    price: number;
    image: string;
  };
}


export default function EventHero({ event }: EventHeroProps) {
    const router = useRouter(); // Use the router
    if (!event) return null;

    const handleBookingClick = () => {
    // router.push(`/app/(main)/booking/${event.id}`);
    router.push(`/booking/${event.id}`); // ✅ will work

  };
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const dateRange = `${startDate.getDate()} ${startDate.toLocaleString('en-US', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleString('en-US', { month: 'short' })}`;

    return (
        <div className="relative w-full rounded-lg overflow-hidden h-[450px] shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent p-10 flex flex-col justify-end">
                <p className="text-sm text-gray-400 font-medium">{dateRange}, 1PM</p>
                <h1 className="text-4xl font-extrabold text-white mt-2 leading-tight">
                    {event.name}
                </h1>
                {/* Use a fallback value if location is undefined */}
                <p className="text-lg text-gray-300 mt-2">{event.location || "Location not available"}</p>
                <p className="text-3xl font-bold text-white mt-4">₹{event.price}</p>
                <Button
        onClick={handleBookingClick} // <-- Add click handler here
        className="mt-6 w-48 bg-gray-700 text-white font-semibold hover:bg-gray-600"
      >
        Book tickets
      </Button>
            </div>
            
            <div className="absolute right-0 top-0 h-full w-1/3 p-4 flex items-center justify-center">
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <img
                        src={event.image}
                        alt={event.name}
                        className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-4">
                        <p className="text-white text-center text-sm font-semibold tracking-wide">
                            INDIA'S GREENEST CIRCULAR FESTIVAL
                        </p>
                    </div>
                </div>
            </div>

            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-black/30 hover:bg-black/50">
                &lt;
            </button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-black/30 hover:bg-black/50">
                &gt;
            </button>
        </div>
    );
}