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

import TranslatedText from "../../common/TranslateText.jsx";
import KioskHeader from "../components/KioskHeader.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";

export default function GuestOptionsPage() {
  const navigate = useNavigate();

  // Spoken title/summary
  usePageSpeech("Guest options. Create a new drink, edit your cart, or go back.");

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
      <KioskHeader />

      <div className="profile-welcome">
        <h1>
          <TranslatedText text="Continue as Guest" />
        </h1>

        <p className="profile-subtitle">
          <TranslatedText text="How would you like to get started?" />
        </p>

        <div className="kiosk-option-grid">
          <SpeakOnHover text="Create new drink">
            <button className="kiosk-action-button" onClick={handleCreateNewDrink}>
              <TranslatedText text="Create New Drink" />
            </button>
          </SpeakOnHover>

          <SpeakOnHover text="Edit existing drink">
            <button className="kiosk-action-button secondary" onClick={handleEditDrink}>
              <TranslatedText text="Edit Existing Drink" />
            </button>
          </SpeakOnHover>
        </div>

        <div className="profile-back">
          <SpeakOnHover text="Back">
            <button className="kiosk-nav" onClick={handleBack}>
              <TranslatedText text="Back" />
            </button>
          </SpeakOnHover>
        </div>
      </div>
    </div>
  );
}
