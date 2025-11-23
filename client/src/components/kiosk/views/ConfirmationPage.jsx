/*
 * ConfirmationPage.jsx
 * -----------------------
 * - Shows final confirmation after a kiosk order is submitted.
 * - Allows user to start a new order.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import { useCart } from "./CartContext.jsx";
import { customerAPI, notificationAPI } from "../../../services/api.js";
import "../css/main.css";

function normalizePhoneInput(value) {
  if (!value) {
    return "";
  }
  return String(value).replace(/\D/g, "");
}

function formatPhoneDisplay(value) {
  const digits = normalizePhoneInput(value);
  if (digits.length !== 10) {
    return digits;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function summarizeCartForReceipt(items = []) {
  return items.map((item) => {
    let drinkName = "";
    if (item.drinkName) {
      drinkName = item.drinkName;
    } else {
      let drinkId = "";
      if (item.drinkId) {
        drinkId = item.drinkId;
      }
      drinkName = `Drink #${drinkId}`;
    }

    let size = "";
    if (item.size) {
      size = item.size;
    }

    let sugar = "";
    if (item.sweetness) {
      sugar = item.sweetness;
    }

    let toppings = [];
    if (Array.isArray(item.toppingDisplayNames)) {
      toppings = item.toppingDisplayNames.filter(Boolean);
    } else if (Array.isArray(item.toppings)) {
      toppings = item.toppings.filter(Boolean);
    }

    return {
      drinkName,
      size,
      sugar,
      ice: item.iceLevel || "",
      toppings,
    };
  });
}

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const {
    customerProfile,
    lastOrderInfo,
    clearLastOrderInfo,
  } = useCart();
  const [phoneInput, setPhoneInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [sending, setSending] = useState(false);

  const profilePhone = customerProfile && customerProfile.phone ? customerProfile.phone : "";
  const hasProfilePhone = Boolean(profilePhone);
  const hasReceiptData = Boolean(lastOrderInfo && lastOrderInfo.receiptId);

  const receiptItems =
    (lastOrderInfo && lastOrderInfo.items) ||
    summarizeCartForReceipt((lastOrderInfo && lastOrderInfo.cart) || []);

  function handleNewOrder() {
    clearLastOrderInfo();
    navigate("/kiosk");
  }

  async function handleSendReceipt(targetPhone) {
    if (!hasReceiptData) {
      setStatusMessage("Receipt data is unavailable.");
      setStatusIsError(true);
      return;
    }

    const digits = normalizePhoneInput(targetPhone);
    if (digits.length !== 10) {
      setStatusMessage("Enter a valid 10-digit phone number.");
      setStatusIsError(true);
      return;
    }

    setSending(true);
    setStatusMessage("");
    setStatusIsError(false);

    try {
      await customerAPI.recordOrder({
        phoneNumber: digits,
        receiptId: lastOrderInfo.receiptId,
        totalAmount: lastOrderInfo.totalAmount || 0,
        cart: lastOrderInfo.cart || [],
      });

      await notificationAPI.sendOrderConfirmation({
        phoneNumber: digits,
        orderNumber: lastOrderInfo.receiptId,
        items: receiptItems,
      });

      setStatusMessage("Receipt sent via text.");
      setStatusIsError(false);
      if (!hasProfilePhone) {
        setPhoneInput("");
      }
    } catch (error) {
      console.error("Failed to send kiosk receipt", error);
      setStatusMessage("Unable to send text right now.");
      setStatusIsError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="kiosk-container">
      <div className="kiosk-language-dropdown"><LanguageDropdown /></div>
      <h1>
        <TranslatedText
          text={
            lastOrderInfo && lastOrderInfo.receiptId
              ? `Thank you! #${lastOrderInfo.receiptId}`
              : "Thank you!"
          }
        />
      </h1>
      {lastOrderInfo && lastOrderInfo.receiptId && (
        <p>
          <TranslatedText text="Order" />{" "}
          <strong>#{lastOrderInfo.receiptId}</strong>{" "}
          <TranslatedText text="has been placed" />
        </p>
      )}
      <p><TranslatedText text={"Please wait for your number to be called"} /></p>

      {hasReceiptData && (
        <div className="kiosk-summary receipt-panel">
            <div style={{ textAlign: "center" }}>
                <h3 style={{ fontWeight: "bold", marginBottom: "8px" }}>Need a receipt?</h3>
                <p style={{ marginTop: "10px", fontWeight: "bold", marginLeft: "50px" }}>
                    {formatPhoneDisplay(profilePhone)}
                </p>
            </div>



            {hasProfilePhone ? (
            <>
              <button
                className="kiosk-action-button"
                onClick={() => handleSendReceipt(profilePhone)}
                disabled={sending}
              >
                <TranslatedText text={sending ? "Sending…" : "Text Receipt"} />
              </button>
            </>
          ) : (
            <>
              <p className="enter-phone">
                <TranslatedText text="Enter your phone number to get a text receipt" />
              </p>
              <div className="receipt-input-group">
                <input
                  type="tel"
                  className="receipt-input-field"
                  placeholder="Enter phone number"
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value)}
                  disabled={sending}
                />
                <button
                  className="kiosk-action-button"
                  onClick={() => handleSendReceipt(phoneInput)}
                  disabled={sending}
                >
                  <TranslatedText text={sending ? "Sending…" : "Text Receipt"} />
                </button>
              </div>
            </>
          )}

          {statusMessage && (
            <p className={statusIsError ? "receipt-status error" : "receipt-status"}>
              <TranslatedText text={statusMessage} />
            </p>
          )}
        </div>
      )}

      <button className="kiosk-action-button" onClick={handleNewOrder}>
        <TranslatedText text={"New Order"} />
      </button>
    </div>
  );
}
