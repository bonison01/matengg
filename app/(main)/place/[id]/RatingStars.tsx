"use client";

import React from "react";

export default function RatingStars({
  rating,
  onRate,
  size = 20,
  interactive = false
}: {
  rating: number;
  onRate?: (value: number) => void;
  size?: number;
  interactive?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((val) => (
        <svg
          key={val}
          onClick={() => interactive && onRate && onRate(val)}
          className={`cursor-pointer transition ${
            val <= rating ? "text-yellow-400" : "text-gray-500"
          }`}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 .587l3.668 7.431L24 9.748l-6 5.854L19.335 24 12 20.201 4.665 24 6 15.602 0 9.748l8.332-1.73z" />
        </svg>
      ))}
    </div>
  );
}
