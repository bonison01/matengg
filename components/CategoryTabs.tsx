"use client";

import React, { useState } from "react";

type Event = {
  id: number;
  title: string;
  start: string; // ISO date
  end: string;   // ISO date
  price: number;
  location: string;
  features: string[];
  contact: string;
};

type OtherItem = {
  id: number;
  category: string;
  title: string;
  description: string;
  location: string;
  features: string[];
  contact: string;
};

interface Props {
  events: Event[];
  others: OtherItem[];
}

const CategoryTabs: React.FC<Props> = ({ events, others }) => {
  const [activeTab, setActiveTab] = useState<"Events" | "Others">("Events");

  const formatDateRange = (start: string, end: string) => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    const s = new Date(start).toLocaleDateString(undefined, opts);
    const e = new Date(end).toLocaleDateString(undefined, opts);
    return `${s} – ${e}`;
  };

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {["Events", "Others"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "Events" | "Others")}
            className={`px-6 py-2 -mb-px font-semibold ${
              activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-400"
            } hover:text-blue-400`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "Events" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <div key={ev.id} className="bg-gray-800 p-5 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">{ev.title}</h3>
              <p className="text-sm mb-1">{formatDateRange(ev.start, ev.end)}</p>
              <p className="text-sm mb-1">Starting from Rs.{ev.price}</p>
              <p className="text-sm mb-2"><span className="font-semibold">Location:</span> {ev.location}</p>
              <div className="mb-2">
                <span className="font-semibold">Features:</span>
                <ul className="list-disc list-inside">
                  {ev.features.map((f, i) => (
                    <li key={i} className="text-sm">{f}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm"><span className="font-semibold">Contact:</span> {ev.contact}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Others" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {others.map((item) => (
            <div key={item.id} className="bg-gray-800 p-5 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-sm mb-1"><span className="font-semibold">Category:</span> {item.category}</p>
              <p className="text-sm mb-1">{item.description}</p>
              <p className="text-sm mb-1"><span className="font-semibold">Location:</span> {item.location}</p>
              <div className="mb-2">
                <span className="font-semibold">Features:</span>
                <ul className="list-disc list-inside">
                  {item.features.map((f, i) => (
                    <li key={i} className="text-sm">{f}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm"><span className="font-semibold">Contact:</span> {item.contact}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTabs;
