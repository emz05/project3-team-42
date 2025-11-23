/*
 * ContrastToggle.jsx
 * -----------------------
 * - Toggle button for switching between normal and high contrast modes
 * - Shows accessibility icon
 */

import React from "react";
import { useContrast } from "./ContrastContext.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import "../css/contrast-toggle.css";

export default function ContrastToggle() {
  const { isHighContrast, toggleContrast } = useContrast();

  return (
    <button
      className={`contrast-toggle ${isHighContrast ? "active" : ""}`}
      onClick={toggleContrast}
      aria-label={isHighContrast ? "Disable High Contrast" : "Enable High Contrast"}
    >
      {/* Accessibility Icon */}
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a10 10 0 0 0 0 20"></path>
      </svg>
      <span className="contrast-toggle-text">
        <TranslatedText text={isHighContrast ? "Normal" : "High Contrast"} />
      </span>
    </button>
  );
}