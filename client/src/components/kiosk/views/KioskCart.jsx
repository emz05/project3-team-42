/*
 * KioskCart.jsx
 * -----------------------
 * - Mini cart display using cashier's CartCard component.
 * - Shows current items with proper formatting.
 */

import React from "react";
import { useCart } from "./CartContext.jsx";
import CartCard from "../../cashier/views/CartCard.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import "../css/main.css";

const KioskCart = () => {
  const { cart, updateCart } = useCart();

  if (cart.length === 0)
    return (
      <div className="kiosk-cart-empty">
        <TranslatedText text={"Your cart is empty"} />
      </div>
    );

  return (
    <div className="kiosk-cart">
      <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "bold" }}>
        <TranslatedText text={"Cart"} />
      </h3>
      {cart.map((item, idx) => (
        <CartCard key={idx} item={item} onUpdate={updateCart} />
      ))}
    </div>
  );
};

export default KioskCart;