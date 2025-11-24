/*
 * ProfileLoginPage.jsx
 * -----------------------
 * - Reuses the cashier LoginPanel for customer phone entry.
 * - Saves the customer's profile in context before showing profile actions.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import LoginPanel from "../../cashier/views/LoginPanel.jsx";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import ContrastToggle from "./ContrastToggle.jsx";
import { useCart } from "./CartContext.jsx";
import { customerAPI } from "../../../services/api.js";
import "../css/kiosk.css";
import "../css/profile.css";
import "../css/contrast-toggle.css";

export default function ProfileLoginPage() {
  const navigate = useNavigate();
  const { setCustomerProfile } = useCart();

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
      <ContrastToggle />
      <div className="kiosk-language-dropdown">
        <LanguageDropdown />
      </div>

      <LoginPanel
        maxDigits={10}
        titleText={"Enter your phone number"}
        errorText={"Enter a valid phone number"}
        onSubmit={handleCustomerLookup}
        onSuccess={() => navigate("/kiosk/profile/options")}
      />

      <div className="profile-back">
        <button className="kiosk-nav-start" onClick={() => navigate("/kiosk/start")}>
          <TranslatedText text="Back to Options" />
        </button>
      </div>
    </div>
  );
}