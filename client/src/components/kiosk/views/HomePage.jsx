import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/kiosk.css";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx"; // Adjusted import path

export default function KioskHomePage() {
  const navigate = useNavigate();

  return (
      <div>
          <div className="kiosk-language-dropdown"><LanguageDropdown/></div>
        <div className="button-container">
          <h1><TranslatedText text={'Welcome!'}/></h1>
          <p><TranslatedText text={'Tap to begin your order'}/></p>
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
