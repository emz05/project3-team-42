/*
 * ReviewPage.jsx 
 * -----------------------
 * - Shows cart summary with proper calculations.
 * - Matches cashier: subtotal, tax (8.26%), total.
 * - Allows quantity adjustments and navigates to payment.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import currency from "currency.js";
import TranslatedText from "../../common/TranslateText.jsx";
import { useCart } from "./CartContext.jsx";

import "../css/main.css";
import "../css/contrast-toggle.css";

import KioskHeader from "../components/KioskHeader.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";

export default function ReviewPage() {
  const navigate = useNavigate();
  const { cart, clearCart, updateCart, customerProfile } = useCart();

  // Calculate totals (match cashier exactly)
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.0826;
  const total = subtotal + tax;

  // Format with currency.js (match cashier)
  const formattedSubtotal = currency(subtotal).format();
  const formattedTax = currency(tax).format();
  const formattedTotal = currency(total).format();

  // Spoken summary of the page
  usePageSpeech(
    cart.length === 0
      ? "Your cart is empty. Add items to start your order."
      : `Review your order. Your total with tax is ${formattedTotal}. You can adjust quantities or proceed to payment.`
  );

  const handleUpdateCart = (updatedItem) => {
    updateCart(updatedItem);
  };

  // Navigate to payment page (order submission happens there)
  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    navigate("/kiosk/payment");
  };

  const handleAddMoreItems = () => {
    if (customerProfile && customerProfile.phone) {
      navigate("/kiosk/profile/options");
    } else {
      navigate("/kiosk/guest");
    }
  };

  // Build customization text (match cashier)
  const buildCustomizationText = (item) => {
    const customizations = [];

    if (item.size) {
      customizations.push(item.size);
    }

    // Map short ice level codes to display text
    const iceLevelMap = {
      Reg: "Regular Ice",
      Lt: "Light Ice",
      No: "No Ice",
      Ext: "Extra Ice",
    };

    // Map short topping codes to display text
    const toppingMap = {
      Boba: "Boba",
      Jely: "Jelly",
      IceC: "Ice Cream",
      Milk: "Condensed Milk",
    };

    if (item.temperature) {
      customizations.push(item.temperature);
    }

    const displayIceLevel = iceLevelMap[item.iceLevel] || item.iceLevel;

    if (item.iceLevel && item.iceLevel !== "Reg") {
      customizations.push(displayIceLevel);
    }

    if (item.sweetness && item.sweetness !== "100%") {
      customizations.push(item.sweetness);
    }

    if (item.toppings && item.toppings.length > 0) {
      // Use display names if available, otherwise map from codes
      const toppingDisplay =
        item.toppingDisplayNames ||
        item.toppings.map((t) => toppingMap[t] || t);
      customizations.push(toppingDisplay.join(", "));
    }

    return customizations.join(" • ");
  };

  return (
    <div className="kiosk-page">
      <KioskHeader />

      <div className="kiosk-container">
        <h2>
          <TranslatedText text={"Your Order"} />
        </h2>

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "20px", color: "#6b7280" }}>
              <TranslatedText text={"Your cart is empty"} />
            </p>
            <SpeakOnHover text="Start shopping">
              <button
                className="kiosk-action-button"
                onClick={() => navigate("/kiosk/categories")}
                style={{ marginTop: "20px" }}
              >
                <TranslatedText text={"Start Shopping"} />
              </button>
            </SpeakOnHover>
          </div>
        ) : (
          <>
            <div className="kiosk-summary">
              {/* Cart Items */}
              {cart.map((item, idx) => {
                const imageURL = `/${item.imagePath || "vite.svg"}`;
                const formattedPrice = currency(item.totalPrice).format();
                const customizationText = buildCustomizationText(item);

                return (
                  <SpeakOnHover
                    key={idx}
                    text={`${item.drinkName}, ${formattedPrice}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        padding: "20px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "12px",
                        marginBottom: "15px",
                      }}
                    >
                      <img
                        src={imageURL}
                        alt={item.drinkName}
                        style={{
                          width: "80px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            margin: "0 0 8px 0",
                          }}
                        >
                          <TranslatedText text={item.drinkName} />
                        </p>
                        {customizationText && (
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#6b7280",
                              margin: "4px 0",
                            }}
                          >
                            {customizationText}
                          </p>
                        )}
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            margin: "8px 0 0 0",
                          }}
                        >
                          {formattedPrice}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleUpdateCart({
                                ...item,
                                quantity: item.quantity - 1,
                              })
                            }
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              border: "none",
                              backgroundColor: "#ed8a8a",
                              color: "white",
                              fontSize: "20px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              fontSize: "20px",
                              fontWeight: "bold",
                              minWidth: "30px",
                              textAlign: "center",
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateCart({
                                ...item,
                                quantity: item.quantity + 1,
                              })
                            }
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              border: "none",
                              backgroundColor: "#a3a9ec",
                              color: "white",
                              fontSize: "20px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </SpeakOnHover>
                );
              })}

              {/* Summary Section */}
              <div
                style={{
                  marginTop: "30px",
                  paddingTop: "20px",

                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                    fontSize: "16px",
                    color: "#6b7280",
                  }}
                >
                  <span>
                    <TranslatedText text={"SUBTOTAL"} />
                  </span>
                  <span style={{ fontWeight: "600", color: "#1f2937" }}>
                    {formattedSubtotal}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    fontSize: "16px",
                    color: "#6b7280",
                  }}
                >
                  <span>
                    <TranslatedText text={"TAX"} />
                  </span>
                  <span style={{ fontWeight: "600", color: "#1f2937" }}>
                    {formattedTax}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "20px",

                  }}
                >
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#1f2937",
                    }}
                  >
                    <TranslatedText text={"TOTAL"} />
                  </span>
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#1f2937",
                    }}
                  >
                    {formattedTotal}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                marginTop: "30px",
              }}
            >
              <SpeakOnHover text="Back to options">
                <button className="kiosk-nav-items" onClick={handleAddMoreItems}>
                  <TranslatedText text={"Back to Options"} />
                </button>
              </SpeakOnHover>

              <SpeakOnHover text="Proceed to payment">
                <button
                  className="kiosk-payment-button"
                  onClick={handleProceedToPayment}
                >
                  <TranslatedText text={"Proceed to Payment"} />
                </button>
              </SpeakOnHover>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
