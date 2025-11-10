import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ReviewPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  return (
    <div className="kiosk-container">
      <h2>Review Your Order</h2>

      <div className="kiosk-summary">
        <p><strong>Drink ID:</strong> {state?.itemId}</p>
        <p><strong>Size:</strong> {state?.size}</p>
        <p><strong>Sugar:</strong> {state?.sugar}</p>
        <p><strong>Ice:</strong> {state?.ice}</p>
      </div>

      <button className="kiosk-button" onClick={() => navigate("/kiosk/confirmation")}>
        Confirm Order
      </button>

      <button className="kiosk-nav" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
}
