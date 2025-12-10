/*
 * CartContext.jsx
 * -----------------------
 * - Manages the shopping cart state.
 * - Matches cashier logic: merges items with same customizations.
 * - Uses abbreviated ice levels (4 char max for database)
 */

import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [lastOrderInfo, setLastOrderInfo] = useState(null);

  // Add item to cart - merge if same customizations exist (match cashier)
    const addToCart = (item) => {
      // Check if item with same customizations already exists
      const existingIndex = cart.findIndex(
        (cartItem) =>
          cartItem.drinkId === item.drinkId &&
          cartItem.temperature === item.temperature &&
          cartItem.size === item.size &&
          cartItem.iceLevel === item.iceLevel &&
          cartItem.sweetness === item.sweetness &&
          JSON.stringify(cartItem.toppings?.sort()) === JSON.stringify(item.toppings?.sort())
      );

    const itemExists = existingIndex >= 0;

    if (itemExists) {
      // Increase quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      updatedCart[existingIndex].totalPrice =
        updatedCart[existingIndex].unitPrice *
        updatedCart[existingIndex].quantity;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([...cart, item]);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const clearCustomerProfile = () => {
    setCustomerProfile(null);
  };
  
  const saveLastOrderInfo = (info) => {
    setLastOrderInfo(info || null);
  };

  const clearLastOrderInfo = () => {
    setLastOrderInfo(null);
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity === 0) {
      removeItem(index);
    } else {
      setCart(
        cart.map((item, idx) =>
          idx === index
            ? {
                ...item,
                quantity: newQuantity,
                totalPrice: item.unitPrice * newQuantity,
              }
            : item
        )
      );
    }
  };

  // Update cart item (match cashier handleUpdateCart)
  const updateCart = (updatedItem) => {
    const shouldRemove = updatedItem.quantity === 0;

    if (shouldRemove) {
        const filteredCart = cart.filter(
          (item) =>
            !(
              item.drinkId === updatedItem.drinkId &&
              item.temperature === updatedItem.temperature &&
              item.size === updatedItem.size &&
              item.iceLevel === updatedItem.iceLevel &&
              item.sweetness === updatedItem.sweetness &&
              JSON.stringify(item.toppings?.sort()) ===
                JSON.stringify(updatedItem.toppings?.sort())
            )
      );
      setCart(filteredCart);
    } else {
        const updatedCart = cart.map((item) => {
        const isSameItem =
          item.drinkId === updatedItem.drinkId &&
          item.temperature === updatedItem.temperature &&
          item.size === updatedItem.size &&
          item.iceLevel === updatedItem.iceLevel &&
          item.sweetness === updatedItem.sweetness &&
          JSON.stringify(item.toppings?.sort()) ===
            JSON.stringify(updatedItem.toppings?.sort());

        if (isSameItem) {
          const newTotalPrice = updatedItem.unitPrice * updatedItem.quantity;
          return { ...updatedItem, totalPrice: newTotalPrice };
        } else {
          return item;
        }
      });
      setCart(updatedCart);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        clearCart,
        removeItem,
        updateQuantity,
        updateCart,
        customerProfile,
        setCustomerProfile,
        clearCustomerProfile,
        lastOrderInfo,
        saveLastOrderInfo,
        clearLastOrderInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
