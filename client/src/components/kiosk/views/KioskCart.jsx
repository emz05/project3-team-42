/*
 * KioskCart.jsx
 * -----------------------
 * - Mini cart display using cashier's CartCard component.
 * - Shows current items with proper formatting.
 */

import React, { useState } from "react";
import { useCart } from "./CartContext.jsx";
import CartCard from "../../cashier/views/CartCard.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import "../css/main.css";

function KioskCart() {
  const { cart, updateCart } = useCart();
  const [isOpen, setIsOpen] = useState(true);

  function handleToggle() {
    setIsOpen(!isOpen);
  }

  const hasItems = cart.length > 0;
  const itemCount = cart.length;

  let cartClassName = "kiosk-cart";
  if (isOpen) {
    cartClassName = "kiosk-cart expanded";
  } else {
    cartClassName = "kiosk-cart collapsed";
  }

  return (
    <div className={cartClassName}>
      <div className="kiosk-cart-header">
        <div className="kiosk-cart-title">
          <TranslatedText text="Cart" /> ({itemCount})
        </div>
        <button className="kiosk-cart-toggle" onClick={handleToggle}>
          {isOpen && <TranslatedText text="Hide" />}
          {!isOpen && <TranslatedText text="Show" />}
        </button>
      </div>

      {isOpen && (
        <div className="kiosk-cart-body">
          {hasItems && (
            <>
              {cart.map((item, idx) => (
                <CartCard key={idx} item={item} onUpdate={updateCart} />
              ))}
            </>
          )}

          {!hasItems && (
            <div className="kiosk-cart-empty">
              <TranslatedText text="Your cart is empty" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default KioskCart;
