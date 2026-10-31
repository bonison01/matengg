"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // default to dark mode

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  const setDarkMode = (val: boolean) => setIsDarkMode(val);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) throw new Error("useDarkMode must be used within a DarkModeProvider");
  return context;
};
