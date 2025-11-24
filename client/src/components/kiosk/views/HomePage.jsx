/*
 * HomePage.jsx
 * -----------------------
 * - Kiosk landing screen shown before ordering.
 * - Lets users start an order, choose language, and toggle contrast.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/kiosk.css";
import "../css/contrast-toggle.css";
import TranslatedText from "../../common/TranslateText.jsx";

import KioskHeader from "../components/KioskHeader.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";

export default function KioskHomePage() {
  const navigate = useNavigate();

  // Read page title when TTS is enabled
  usePageSpeech("Welcome. Tap the button to begin your order.");

  return (
    <div className="kiosk-page">
      {/* Global header with contrast, language, TTS toggle */}
      <KioskHeader />

      <div className="kiosk-welcome-container">
        <h1><TranslatedText text={'Welcome!'}/></h1>
        <p><TranslatedText text={'Tap to begin your order'}/></p>

        {/* Start kiosk ordering flow */}
        <SpeakOnHover text="Start Order">
          <button
            className="kiosk-start-button"
            onClick={() => navigate("/kiosk/start")}
          >
            <TranslatedText text={'Start Order'}/>
          </button>
        </SpeakOnHover>

      </div>
    </div>
  );
}
