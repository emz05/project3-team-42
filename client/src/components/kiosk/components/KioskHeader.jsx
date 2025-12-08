import React from "react";
import TextToSpeechToggle from "./TextToSpeechToggle.jsx";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import ContrastToggle from "../views/ContrastToggle.jsx";

import "../css/kiosk-header.css";

export default function KioskHeader() {
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
        <h2>Accessibility</h2>
      </div>

      {/* Right: Language + TTS */}
      <div className="kiosk-header-right">
        <LanguageDropdown />
        <TextToSpeechToggle />
      </div>
    </header>
  );
}
