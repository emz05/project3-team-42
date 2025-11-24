import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/kiosk.css";
import "../css/contrast-toggle.css";
import TranslatedText from "../../common/TranslateText.jsx";

import KioskHeader from "../components/KioskHeader.jsx";

export default function KioskHomePage() {
  const navigate = useNavigate();

  return (
    <div className="kiosk-page">

      {/* Global header with contrast, language, TTS toggle */}
      <KioskHeader />

      <div className="kiosk-welcome-container">
        <h1><TranslatedText text={'Welcome!'}/></h1>
        <p><TranslatedText text={'Tap to begin your order'}/></p>

        <button
          className="kiosk-start-button"
          onClick={() => navigate("/kiosk/start")}
        >
          <TranslatedText text={'Start Order'} />
        </button>
      </div>
    </div>
  );
}
