/*
 * ContrastContext.jsx
 * -----------------------
 * - Manages high contrast mode state across the kiosk
 * - Persists preference in localStorage
 */

import { createContext, useContext, useState, useEffect } from "react";

const ContrastContext = createContext();

export const ContrastProvider = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem("kioskHighContrast");
    return saved === "true";
  });

  // Apply contrast class to body
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }
    
    // Save to localStorage
    localStorage.setItem("kioskHighContrast", isHighContrast);
  }, [isHighContrast]);

  const toggleContrast = () => {
    setIsHighContrast((prev) => !prev);
  };

  return (
    <ContrastContext.Provider value={{ isHighContrast, toggleContrast }}>
      {children}
    </ContrastContext.Provider>
  );
};

export const useContrast = () => useContext(ContrastContext);