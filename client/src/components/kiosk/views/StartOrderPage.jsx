/*
 * StartOrderPage.jsx
 * -----------------------
 * - Presented after tapping Start Order on the kiosk home screen.
 * - Lets customers pick guest checkout or profile login.
 */

import { useNavigate } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import "../css/kiosk.css";
import "../css/profile.css";

export default function StartOrderPage() {
  const navigate = useNavigate();

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
      <div className="kiosk-language-dropdown">
        <LanguageDropdown />
      </div>

      <div className="profile-welcome">
        <h1>
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
            <button className="kiosk-action-button" onClick={handleGuest}>
              <TranslatedText text="Continue as Guest" />
            </button>
          </div>

          <div className="kiosk-choice-card">
            <h3>
              <TranslatedText text="Profile Login" />
            </h3>
            <p className="profile-card-text">
              <TranslatedText text="Use your phone number to view past drinks" />
            </p>
            <button className="kiosk-action-button secondary" onClick={handleProfile}>
              <TranslatedText text="Use My Phone Number" />
            </button>
          </div>
        </div>

        <div className="profile-back">
          <button className="kiosk-nav-start" onClick={handleBack}>
            <TranslatedText text="Back to Start" />
          </button>
        </div>
      </div>
    </div>
  );
}
