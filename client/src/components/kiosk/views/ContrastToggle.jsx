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
      className={`bg-white rounded-full px-6 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center gap-2 transition-shadow text-sm font-semibold text-gray-800 hover:shadow-[0_8px_18px_rgba(0,0,0,0.16)] ${isHighContrast ? "ring-2 ring-indigo-500/60" : ""}`}
      onClick={toggleContrast}
      aria-label={isHighContrast ? "Disable High Contrast" : "Enable High Contrast"}
    >
      {/* Accessibility Icon */}
      <svg
        className="w-4 h-4"
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
      <span className="whitespace-nowrap">
        <TranslatedText text={isHighContrast ? "Normal" : "High Contrast"} />
      </span>
    </button>
  );
}
