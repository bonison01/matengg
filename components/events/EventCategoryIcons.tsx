// src/components/events/EventCategoryIcons.tsx
import React from 'react';
import { Music, Mic, Moon, Tent, Box } from "lucide-react";

const categories = [
    { name: "Music", icon: Music },
    { name: "Comedy", icon: Mic },
    { name: "Nightlife", icon: Moon },
    { name: "Fests & Fairs", icon: Tent },
    { name: "Expos", icon: Box },
];

export default function EventCategoryIcons() {
    return (
        <div className="w-full">
            <h2 className="text-xl font-semibold text-white mb-4">Explore Events</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
                {categories.map((cat) => (
                    <div 
                        key={cat.name} 
                        className="flex flex-col items-center justify-center p-6 rounded-lg bg-gray-800 text-gray-200 min-w-[150px] aspect-square shadow-lg hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                        <cat.icon size={48} className="text-purple-400 mb-2" />
                        <span className="text-sm font-semibold">{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}