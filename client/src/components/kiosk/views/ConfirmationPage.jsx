/*
 * ConfirmationPage.jsx
 * -----------------------
 * - Shows final confirmation after a kiosk order is submitted.
 * - Allows user to start a new order.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import ContrastToggle from "./ContrastToggle.jsx";
import "../css/main.css";
import "../css/contrast-toggle.css";

export default function ConfirmationPage() {
  const navigate = useNavigate();

  return (
    <div className="kiosk-container">
      <ContrastToggle />
      <div className="kiosk-language-dropdown"><LanguageDropdown /></div>
      
      <h1><TranslatedText text={"Thank you!"} /></h1>
      <p><TranslatedText text={"Your order has been placed."} /></p>
      <p><TranslatedText text={"Please wait for your number to be called."} /></p>

      <button className="kiosk-action-button" onClick={() => navigate("/kiosk")}>
        <TranslatedText text={"New Order"} />
      </button>
    </div>
  );
}