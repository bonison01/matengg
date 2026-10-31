"use client";

import { ReactNode } from "react";
import { useDarkMode } from "./DarkModeContext";

export default function DarkModeWrapper({ children }: { children: ReactNode }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <>
      <button
        onClick={toggleDarkMode}
        className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-md transition
          ${isDarkMode ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-gray-200 text-black hover:bg-gray-300"}
        `}
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
      >
        {isDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </button>

      {children}
    </>
  );
}
