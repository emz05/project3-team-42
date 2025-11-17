/*
 * HomePage.jsx
 * -----------------------
 * - Kiosk landing screen shown before ordering.
 * - Lets users start an order and choose language.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/kiosk.css";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";

export default function KioskHomePage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Kiosk language selector */}
      <div className="kiosk-language-dropdown"><LanguageDropdown/></div>

      <div className="button-container">
        <h1><TranslatedText text={'Welcome!'}/></h1>
        <p><TranslatedText text={'Tap to begin your order'}/></p>

        {/* Start kiosk ordering flow */}
        <button
          className="kiosk-button"
          onClick={() => navigate("/kiosk/categories")}
        >
          <TranslatedText text={'Start Order'}/>
        </button>
      </div>
    </div>
  );
}
