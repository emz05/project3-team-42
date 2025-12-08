/*
 * StartOrderPage.jsx
 * -----------------------
 * - Presented after tapping Start Order on the kiosk home screen.
 * - Lets customers pick guest checkout or profile login.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import TranslatedText from "../../common/TranslateText.jsx";

import "../css/kiosk.css";
import "../css/profile.css";
import "../css/contrast-toggle.css";

import KioskHeader from "../components/KioskHeader.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";

export default function StartOrderPage() {
  const navigate = useNavigate();

  // Read page title / instructions when TTS is enabled
  usePageSpeech("Start your order. Choose guest checkout or sign in with your phone number.");

  function handleGuest() {
    navigate("/kiosk/guest");
  }

  function handleProfile() {
    navigate("/kiosk/profile/login");
  }

  function handleBack() {
    navigate("/kiosk");
  }

  return (
    <div className="kiosk-page">
      {/* Shared kiosk header with contrast, language, and TTS toggle */}
      <KioskHeader />

      <main role="main" aria-labelledby="start-order-title">
        <div className="profile-welcome">
          <h1 id="start-order-title">
            <TranslatedText text="Start Order" />
          </h1>

          <p className="profile-subtitle">
            <TranslatedText text="Choose how you'd like to continue" />
          </p>

          <div className="kiosk-choice-grid">
            <div className="kiosk-choice-card">
              <h3>
                <TranslatedText text="Guest Order" />
              </h3>
              <p className="profile-card-text">
                <TranslatedText text="Build a drink without saving your history" />
              </p>
              <SpeakOnHover text="Continue as guest">
                <button className="kiosk-action-button" onClick={handleGuest}>
                  <TranslatedText text="Continue as Guest" />
                </button>
              </SpeakOnHover>
            </div>

            <div className="kiosk-choice-card">
              <h3>
                <TranslatedText text="Profile Login" />
              </h3>
              <p className="profile-card-text">
                <TranslatedText text="Use your phone number to view past drinks" />
              </p>
              <SpeakOnHover text="Use my phone number">
                <button
                  className="kiosk-action-button secondary"
                  onClick={handleProfile}
                >
                  <TranslatedText text="Use My Phone Number" />
                </button>
              </SpeakOnHover>
            </div>
          </div>

          <div className="profile-back">
            <SpeakOnHover text="Back to start">
              <button className="kiosk-nav-start" onClick={handleBack}>
                <TranslatedText text="Back to Start" />
              </button>
            </SpeakOnHover>
          </div>
        </div>
      </main>
    </div>
  );
}
