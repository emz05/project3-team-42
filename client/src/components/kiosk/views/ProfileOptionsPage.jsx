/*
 * ProfileOptionsPage.jsx
 * -----------------------
 * - Shown after a customer logs in with their phone number.
 * - Gives shortcuts to create a drink, view history, or edit the live cart.
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TranslatedText from "../../common/TranslateText.jsx";
import { useCart } from "./CartContext.jsx";

import "../css/kiosk.css";
import "../css/main.css";
import "../css/profile.css";
import "../css/contrast-toggle.css";

import KioskHeader from "../components/KioskHeader.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";

export default function ProfileOptionsPage() {
  const navigate = useNavigate();
  const { customerProfile } = useCart();

  let phone = null;
  if (customerProfile && customerProfile.phone) {
    phone = customerProfile.phone;
  }

  // Redirect if no phone (not logged in)
  useEffect(() => {
    if (!phone) {
      navigate("/kiosk/profile/login", { replace: true });
    }
  }, [phone, navigate]);

  // Spoken summary when TTS is enabled
  usePageSpeech(
    "Welcome back. You can create a new drink, view your past orders, or edit your current drink."
  );

  function handleCreateNewDrink() {
    navigate("/kiosk/categories");
  }

  function handleViewOrders() {
    navigate("/kiosk/profile/orders");
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
          <TranslatedText text="Welcome back!" />
        </h1>
        {phone && (
          <p className="profile-phone">
            <TranslatedText text={` ${phone}`} />
          </p>
        )}
        <p className="profile-subtitle">
          <TranslatedText text="What would you like to do today?" />
        </p>

        <div className="kiosk-option-grid">
          <SpeakOnHover text="Create new drink">
            <button className="kiosk-action-button" onClick={handleCreateNewDrink}>
              <TranslatedText text="Create New Drink" />
            </button>
          </SpeakOnHover>

          <SpeakOnHover text="View past orders">
            <button className="kiosk-action-button secondary" onClick={handleViewOrders}>
              <TranslatedText text="View Past Orders" />
            </button>
          </SpeakOnHover>

          <SpeakOnHover text="Edit existing drink">
            <button className="kiosk-action-button success" onClick={handleEditDrink}>
              <TranslatedText text="Edit Existing Drink" />
            </button>
          </SpeakOnHover>
        </div>

        <div className="profile-back">
          <SpeakOnHover text="Back to login">
            <button className="kiosk-nav-start" onClick={handleBack}>
              <TranslatedText text="Back to Login" />
            </button>
          </SpeakOnHover>
        </div>
      </div>
    </div>
  );
}
