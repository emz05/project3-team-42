import React from "react";
import { useNavigate } from "react-router-dom";
import "../../kiosk/css/kiosk.css";

export default function KioskHomePage() {
  const navigate = useNavigate();

  return (
    <div className="kiosk-container">
      <h1>Welcome!</h1>
      <p>Tap to begin your order</p>
      <button className="kiosk-button" onClick={() => navigate("/kiosk/categories")}>
        Start Order
      </button>
    </div>
  );
}
