/*
 * ProfileOptionsPage.jsx
 * -----------------------
 * - Shown after a customer logs in with their phone number.
 * - Gives shortcuts to create a drink, view history, or edit the live cart.
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import { useCart } from "./CartContext.jsx";
import "../css/kiosk.css";
import "../css/main.css";
import "../css/profile.css";

export default function ProfileOptionsPage() {
  const navigate = useNavigate();
  const { customerProfile } = useCart();

  let phone = null;
  if (customerProfile && customerProfile.phone) {
    phone = customerProfile.phone;
  }

  useEffect(() => {
    if (!phone) {
      navigate("/kiosk/profile/login", { replace: true });
    }
  }, [phone, navigate]);

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
      <div className="kiosk-language-dropdown">
        <LanguageDropdown />
      </div>

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
          <button className="kiosk-action-button" onClick={handleCreateNewDrink}>
            <TranslatedText text="Create New Drink" />
          </button>

          <button className="kiosk-action-button secondary" onClick={handleViewOrders}>
            <TranslatedText text="View Past Orders" />
          </button>

          <button className="kiosk-action-button success" onClick={handleEditDrink}>
            <TranslatedText text="Edit Existing Drink" />
          </button>
        </div>

        <div className="profile-back">
          <button className="kiosk-nav-start" onClick={handleBack}>
            <TranslatedText text="Back to Login" />
          </button>
        </div>
      </div>
    </div>
  );
}
