import React from "react";
import { useNavigate } from "react-router-dom";
import TextToSpeechToggle from "./TextToSpeechToggle.jsx";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import ContrastToggle from "../views/ContrastToggle.jsx";
import MagnifierToggle from "../../common/MagnifierToggle.jsx";

import "../css/kiosk-header.css";

export default function KioskHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/home");
  };

  return (
    <header
      className="kiosk-header"
      role="banner"
      aria-label="Kiosk accessibility controls"
    >
      {/* Left: High Contrast */}
      <div className="kiosk-header-left">
        <ContrastToggle />
      </div>

      {/* Center: Title */}
      <div className="kiosk-header-title">
        <h2></h2>
      </div>

      {/* Right: Language + TTS + Magnifier */}
      <div className="kiosk-header-right">
        <LanguageDropdown />
        <TextToSpeechToggle />
        <MagnifierToggle />
        <button
          type="button"
          onClick={handleLogout}
          className="bg-white rounded-full px-6 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center gap-2 transition-shadow text-sm font-semibold text-gray-800 hover:shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
