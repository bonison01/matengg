import React, { useState } from "react";
import "./rating.css";

interface RatingProps {
  rating: number;
  onRate?: (value: number) => void;
  editable?: boolean;
  size?: number;
}

const Rating: React.FC<RatingProps> = ({
  rating,
  onRate,
  editable = false,
  size = 30,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const handleClick = (star: number) => {
    if (editable) {
      onRate?.(star);
    }
  };

  return (
    <div className="rating" style={{ fontSize: `${size}px` }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${
            hoveredStar !== null
              ? star <= hoveredStar
                ? "hovered"
                : ""
              : star <= rating
              ? "filled"
              : ""
          }`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => editable && setHoveredStar(star)}
          onMouseLeave={() => editable && setHoveredStar(null)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default Rating;
