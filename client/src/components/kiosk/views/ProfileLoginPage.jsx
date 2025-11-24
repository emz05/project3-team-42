/*
 * ProfileLoginPage.jsx
 * -----------------------
 * - Reuses the cashier LoginPanel for customer phone entry.
 * - Saves the customer's profile in context before showing profile actions.
 */

import React from "react";
import { useNavigate } from "react-router-dom";

import LoginPanel from "../../cashier/views/LoginPanel.jsx";
import TranslatedText from "../../common/TranslateText.jsx";

import "../css/kiosk.css";
import "../css/profile.css";
import "../css/contrast-toggle.css";

import KioskHeader from "../components/KioskHeader.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";

import { useCart } from "./CartContext.jsx";
import { customerAPI } from "../../../services/api.js";

export default function ProfileLoginPage() {
  const navigate = useNavigate();
  const { setCustomerProfile } = useCart();

  // Spoken instructions when TTS is enabled
  usePageSpeech("Enter your phone number to continue.");

  const handleCustomerLookup = async (phoneInput) => {
    const digitsOnly = String(phoneInput || "").replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      throw new Error("INVALID_PHONE");
    }

    const response = await customerAPI.recentOrders(digitsOnly);
    const orders = response?.data?.orders || [];
    setCustomerProfile({ phone: digitsOnly, orders });
    return response;
  };

  return (
    <div className="kiosk-page">
      <KioskHeader />

      <LoginPanel
        maxDigits={10}
        titleText={"Enter your phone number"}
        errorText={"Enter a valid phone number"}
        onSubmit={handleCustomerLookup}
        onSuccess={() => navigate("/kiosk/profile/options")}
      />

      <div className="profile-back">
        <SpeakOnHover text="Back to options">
          <button className="kiosk-nav-start" onClick={() => navigate("/kiosk/start")}>
            <TranslatedText text="Back to Options" />
          </button>
        </SpeakOnHover>
      </div>
    </div>
  );
}
