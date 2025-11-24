/*
 * GuestOptionsPage.jsx
 * -----------------------
 * - Lets kiosk users continue as guests.
 * - Provides shortcuts to create a new drink or edit the active cart.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/kiosk.css";
import "../css/main.css";
import "../css/profile.css";
import "../css/contrast-toggle.css";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import ContrastToggle from "./ContrastToggle.jsx";

export default function GuestOptionsPage() {
  const navigate = useNavigate();

  function handleCreateNewDrink() {
    navigate("/kiosk/categories");
  }

  function handleEditDrink() {
    navigate("/kiosk/review");
  }

  function handleBack() {
    navigate("/kiosk/start");
  }

  return (
    <div className="kiosk-page">
      <ContrastToggle />
      <div className="kiosk-language-dropdown">
        <LanguageDropdown />
      </div>

      <div className="profile-welcome">
        <h1>
          <TranslatedText text="Continue as Guest" />
        </h1>

        <p className="profile-subtitle">
          <TranslatedText text="How would you like to get started?" />
        </p>

        <div className="kiosk-option-grid">
          <button className="kiosk-action-button" onClick={handleCreateNewDrink}>
            <TranslatedText text="Create New Drink" />
          </button>

          <button className="kiosk-action-button secondary" onClick={handleEditDrink}>
            <TranslatedText text="Edit Existing Drink" />
          </button>
        </div>

        <div className="profile-back">
          <button className="kiosk-nav" onClick={handleBack}>
            <TranslatedText text="Back" />
          </button>
        </div>
      </div>
    </div>
  );
}