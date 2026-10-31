import React from "react";
import "./TruckAnimation.css";

interface CheckmarkCircleProps {
    checked: boolean;
}

const CheckmarkCircle: React.FC<CheckmarkCircleProps> = ({ checked }) => {
    return (
        <div className={`checkmark-circle ${checked ? "checked" : ""}`}>
            <svg width="80" height="80">
                <circle
                    fill="none"
                    stroke="#68E534"
                    strokeWidth="6"
                    cx="40"
                    cy="40"
                    r="35"
                    className="circle"
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                />
                <polyline
                    fill="none"
                    stroke="#68E534"
                    strokeWidth="6"
                    points="25,42 36,54 55,30"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="tick"
                />
            </svg>
        </div>
    );
};

export default CheckmarkCircle;
