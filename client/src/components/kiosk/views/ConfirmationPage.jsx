import React from "react";
import { useNavigate } from "react-router-dom";

export default function ConfirmationPage() {
  const navigate = useNavigate();

  return (
    <div className="kiosk-container">
      <h1>Thank You!</h1>
      <p>Your order has been placed.</p>
      <p>Please wait for your number to be called.</p>

      <button className="kiosk-button" onClick={() => navigate("/kiosk")}>
        New Order
      </button>
    </div>
  );
}
