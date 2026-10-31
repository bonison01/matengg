"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isDarkMode?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  isDarkMode = true,
}: SearchBarProps) {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  return (
    <div className="flex items-center">
      {/* Search Icon */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={`p-2 rounded-full transition-colors ${
          isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-green-600"
        }`}
      >
        <Search size={20} />
      </button>

      {/* Expanding Input */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "w-48 sm:w-64 ml-2" : "w-0"
        }`}
      >
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`px-3 py-2 rounded-lg shadow border focus:ring-2 focus:outline-none ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-200 focus:ring-green-500"
              : "bg-gray-100 border-gray-300 text-gray-900 focus:ring-green-600"
          }`}
        />
      </div>
    </div>
  );
}
