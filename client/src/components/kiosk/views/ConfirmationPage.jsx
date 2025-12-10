/*
 * ConfirmationPage.jsx
 * -----------------------
 * - Shows final confirmation after a kiosk order is submitted.
 * - Allows user to start a new order.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TranslatedText from "../../common/TranslateText.jsx";
import { useCart } from "./CartContext.jsx";
import { customerAPI, notificationAPI } from "../../../services/api.js";

import "../css/main.css";
import "../css/contrast-toggle.css";

import KioskHeader from "../components/KioskHeader.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";

function normalizePhoneInput(value) {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
}

function formatPhoneDisplay(value) {
  const digits = normalizePhoneInput(value);
  if (digits.length !== 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function summarizeCartForReceipt(items = []) {
  return items.map((item) => {
    let drinkName = item.drinkName || `Drink #${item.drinkId || ""}`;
    let size = item.size || "";
    let sugar = item.sweetness || "";

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

  const profilePhone = customerProfile?.phone || "";
  const hasProfilePhone = Boolean(profilePhone);
  const hasReceiptData = Boolean(lastOrderInfo?.receiptId);

  const receiptItems =
    lastOrderInfo?.items ||
    summarizeCartForReceipt(lastOrderInfo?.cart || []);

  const orderId = lastOrderInfo?.receiptId;

  // 🔊 Spoken summary for this screen
  usePageSpeech(
    orderId
      ? `Your order has been placed. Order number ${orderId}. You may request a text receipt or start a new order.`
      : "Your order has been placed. You may request a text receipt or start a new order."
  );

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
        receiptId: orderId,
        totalAmount: lastOrderInfo.totalAmount || 0,
        cart: lastOrderInfo.cart || [],
      });

      await notificationAPI.sendOrderConfirmation({
        phoneNumber: digits,
        orderNumber: orderId,
        items: receiptItems,
      });

      setStatusMessage("Receipt sent via text.");
      setStatusIsError(false);

      if (!hasProfilePhone) setPhoneInput("");

    } catch (error) {
      console.error("Failed to send kiosk receipt", error);
      setStatusMessage("Unable to send text right now.");
      setStatusIsError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="kiosk-page">
      <KioskHeader />

      <div className="kiosk-container" style={{ textAlign: "center" }}>
        <h1><TranslatedText text={"Thank you!"} /></h1>
        <p><TranslatedText text={"Your order has been placed."} /></p>

        {orderId && (
          <>
            <h2>
              <TranslatedText text={`Order #${orderId}`} />
            </h2>
            <p>
              <TranslatedText text="Please wait for your number to be called." />
            </p>
          </>
        )}

        {/* Receipt Panel */}
        {hasReceiptData && (
          <div className="kiosk-summary receipt-panel" style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontWeight: "bold" }}>
              <TranslatedText text="Need a receipt?" />
            </h3>

            {hasProfilePhone && (
              <p style={{ marginTop: "10px", fontWeight: "bold", textAlign: "center"}}>
                {formatPhoneDisplay(profilePhone)}
              </p>
            )}

            {hasProfilePhone ? (
              <SpeakOnHover text="Text receipt">
                <button
                  className="kiosk-action-button"
                  onClick={() => handleSendReceipt(profilePhone)}
                  disabled={sending}
                >
                  <TranslatedText text={sending ? "Sending…" : "Text Receipt"} />
                </button>
              </SpeakOnHover>
            ) : (
              <>
                <p className="enter-phone">
                  <TranslatedText text="Enter your phone number to receive a text receipt" />
                </p>

                <div className="receipt-input-group">
                  <input
                    type="tel"
                    className="receipt-input-field"
                    placeholder="Enter phone number"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    disabled={sending}
                  />

                  <SpeakOnHover text="Send receipt">
                    <button
                      className="kiosk-action-button"
                      onClick={() => handleSendReceipt(phoneInput)}
                      disabled={sending}
                    >
                      <TranslatedText text={sending ? "Sending…" : "Text Receipt"} />
                    </button>
                  </SpeakOnHover>
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

        {/* New Order Button */}
        <div style={{ marginTop: "2rem" }}>
          <SpeakOnHover text="Start a new order">
            <button className="kiosk-action-button" onClick={handleNewOrder}>
              <TranslatedText text={"New Order"} />
            </button>
          </SpeakOnHover>
        </div>
      </div>
    </div>
  );
}