/*
 * ProfileOrdersPage.jsx
 * -----------------------
 * - Displays recently saved drinks for a logged-in customer.
 * - Reuses customer profile data in CartContext to avoid extra fetches.
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import { customerAPI } from "../../../services/api.js";
import TranslatedText from "../../common/TranslateText.jsx";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import KioskCart from "./KioskCart.jsx";
import "../css/main.css";
import "../css/profile.css";

export default function ProfileOrdersPage() {
  const navigate = useNavigate();
  const { customerProfile, setCustomerProfile, addToCart } = useCart();

  let phone = null;
  if (customerProfile && customerProfile.phone) {
    phone = customerProfile.phone;
  }

  let existingOrders = [];
  if (customerProfile && customerProfile.orders) {
    existingOrders = customerProfile.orders;
  }

  const [orders, setOrders] = useState(existingOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addError, setAddError] = useState("");
  const [addStatus, setAddStatus] = useState({});

  useEffect(() => {
    if (!phone) {
      navigate("/kiosk/profile/login", { replace: true });
      return;
    }

    if (existingOrders.length > 0) {
      return;
    }

    async function fetchOrders() {
      setLoading(true);
      setError("");

      try {
        const { data } = await customerAPI.recentOrders(phone);

        let latestOrders = [];
        if (data && data.orders) {
          latestOrders = data.orders;
        }

        setOrders(latestOrders);
        setCustomerProfile({ phone, orders: latestOrders });
      } catch (err) {
        console.error("Failed to load customer orders", err);
        setError("Unable to load order history right now.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [phone, existingOrders.length, navigate, setCustomerProfile]);

  useEffect(() => {
    if (customerProfile && customerProfile.orders && customerProfile.orders.length) {
      setOrders(customerProfile.orders);
    }
  }, [customerProfile]);

  const formattedOrders = useMemo(() => {
    if (!orders) {
      return [];
    }

    return orders.map((order) => {
      let cartItems = [];
      if (Array.isArray(order.cart)) {
        cartItems = order.cart;
      }

      let timestamp = null;
      if (order.transaction_date) {
        timestamp = order.transaction_date;
      } else if (order.created_at) {
        timestamp = order.created_at;
      }

      return {
        id: order.receipt_id,
        total: order.total_amount,
        placedAt: timestamp,
        cart: cartItems,
      };
    });
  }, [orders]);

  function handleCreateNewDrink() {
    navigate("/kiosk/categories");
  }

  function handleGoBack() {
    navigate("/kiosk/profile/options");
  }

  async function handleAddPastDrink(item, historyKey) {
    const key = historyKey || `history-${Date.now()}`;
    const currentStatus = addStatus[key];
    if (currentStatus === "adding") {
      return;
    }

    setAddError("");
    setAddStatus((prev) => ({ ...prev, [key]: "adding" }));

    try {
      const historyDrinkId = getDrinkIdFromHistory(item);
      let drinkDetails = null;
      if (historyDrinkId) {
        drinkDetails = await fetchDrinkDetails(historyDrinkId);
      }

      const cartItem = buildCartItemFromHistory(item, drinkDetails);
      addToCart(cartItem);

      setAddStatus((prev) => ({ ...prev, [key]: "added" }));
      setTimeout(() => {
        setAddStatus((prev) => ({ ...prev, [key]: "idle" }));
      }, 1000);
    } catch (err) {
      console.error("Failed to add past drink", err);
      setAddError("Unable to add this drink right now.");
      setAddStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  }

  const hasOrders = formattedOrders.length > 0;
  const showEmptyMessage = !loading && !hasOrders && !error;

  return (
    <div className="kiosk-container profile-orders-page">
      <div className="kiosk-language-dropdown">
        <LanguageDropdown />
      </div>
      <KioskCart />

      <h2>
        <TranslatedText text="Past Drinks" />
      </h2>

      {phone && (
        <p className="profile-phone">
          <TranslatedText text={`Phone: ${phone}`} />
        </p>
      )}

      {loading && (
        <p className="profile-orders-message">
          <TranslatedText text="Loading your drinks..." />
        </p>
      )}

      {error && (
        <p className="profile-orders-error">
          <TranslatedText text={error} />
        </p>
      )}

      {showEmptyMessage && (
        <p className="profile-orders-message">
          <TranslatedText text="No previous drinks found." />
        </p>
      )}

      {addError && (
        <p className="profile-orders-error">
          <TranslatedText text={addError} />
        </p>
      )}

      <div className="profile-orders-list">
        {formattedOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onAddDrink={handleAddPastDrink}
            addStatus={addStatus}
          />
        ))}
      </div>

      <div className="profile-order-actions">
        <button className="kiosk-action-button" onClick={handleCreateNewDrink}>
          <TranslatedText text="Create New Drink" />
        </button>
        <button className="kiosk-nav-orders" onClick={handleGoBack}>
          <TranslatedText text="Back to Options" />
        </button>
      </div>
    </div>
  );
}

function OrderCard({ order, onAddDrink, addStatus }) {
  let formattedDate = "";
  if (order.placedAt) {
    formattedDate = new Date(order.placedAt).toLocaleString();
  }

  return (
    <div className="profile-order-card">
      <div className="profile-order-header">
        <h3 className="profile-order-title">
          <TranslatedText text={`Receipt #${order.id}`} />
        </h3>
        <span className="profile-order-date">{formattedDate}</span>
      </div>

      <div className="profile-order-items">
        {order.cart.map((item, idx) => {
          const isLast = idx === order.cart.length - 1;
          const historyKey = buildHistoryKey(order.id, idx, item);

          let status = "idle";
          if (addStatus && addStatus[historyKey]) {
            status = addStatus[historyKey];
          }

          return (
            <DrinkItem
              key={`${order.id}-${idx}`}
              item={item}
              isLast={isLast}
              onAddDrink={onAddDrink}
              status={status}
              historyKey={historyKey}
            />
          );
        })}
      </div>
    </div>
  );
}

function DrinkItem({ item, isLast, onAddDrink, status, historyKey }) {
  let drinkName = "Drink";
  if (item.drinkName) {
    drinkName = item.drinkName;
  } else if (item.drink_name) {
    drinkName = item.drink_name;
  }

  let quantity = 1;
  if (item.quantity) {
    quantity = item.quantity;
  }

  let sweetness = "100%";
  if (item.sweetness) {
    sweetness = item.sweetness;
  }

  let iceLevel = normalizeIceLevel(item.iceLevel);

  let toppings = "";
  if (Array.isArray(item.toppings)) {
    toppings = item.toppings.join(", ");
  }

  let itemClass = "profile-order-item";
  if (isLast) {
    itemClass = "profile-order-item last";
  }

  function handleAddClick() {
    if (typeof onAddDrink === "function") {
      onAddDrink(item, historyKey);
    }
  }

  let buttonText = "Add to Cart";
  if (status === "adding") {
    buttonText = "Adding...";
  } else if (status === "added") {
    buttonText = "Added!";
  } else if (status === "error") {
    buttonText = "Retry";
  }

  const isDisabled = status === "adding";

  return (
    <div className={itemClass}>
      <strong>{drinkName}</strong>

      <div className="profile-order-item-details">
        <TranslatedText text={`Qty ${quantity} • ${sweetness} • ${iceLevel}`} />
      </div>

      {toppings && (
        <div className="profile-order-item-details">
          <TranslatedText text={toppings} />
        </div>
      )}

      <button
        className="profile-order-add"
        onClick={handleAddClick}
        disabled={isDisabled}
      >
        <TranslatedText text={buttonText} />
      </button>
    </div>
  );
}

function buildCartItemFromHistory(item, drinkDetails) {
  if (!item) {
    return {
      drinkId: null,
      drinkName: "Drink",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      iceLevel: "Regular Ice",
      sweetness: "100%",
      toppings: [],
      toppingDisplayNames: [],
    };
  }

  let quantity = 1;
  if (item.quantity) {
    quantity = item.quantity;
  }

  const drinkId = getDrinkIdFromHistory(item);

  let drinkName = "Drink";
  if (drinkDetails && drinkDetails.drink_name) {
    drinkName = drinkDetails.drink_name;
  } else if (drinkDetails && drinkDetails.name) {
    drinkName = drinkDetails.name;
  } else if (item.drinkName) {
    drinkName = item.drinkName;
  } else if (item.drink_name) {
    drinkName = item.drink_name;
  }

  let imagePath = "";
  if (drinkDetails && drinkDetails.drink_image_path) {
    imagePath = drinkDetails.drink_image_path;
  } else if (drinkDetails && drinkDetails.imagePath) {
    imagePath = drinkDetails.imagePath;
  } else if (item.imagePath) {
    imagePath = item.imagePath;
  } else if (item.drink_image_path) {
    imagePath = item.drink_image_path;
  }

  let unitPriceRaw = null;
  if (drinkDetails && drinkDetails.drink_price !== undefined) {
    unitPriceRaw = drinkDetails.drink_price;
  }

  if (unitPriceRaw === null) {
    unitPriceRaw = 0;
    if (item.unitPrice !== undefined) {
      unitPriceRaw = item.unitPrice;
    } else if (item.unit_price !== undefined) {
      unitPriceRaw = item.unit_price;
    } else if (item.totalPrice !== undefined) {
      unitPriceRaw = item.totalPrice;
    } else if (item.total_price !== undefined) {
      unitPriceRaw = item.total_price;
    }
  }

  let unitPrice = 0;
  if (quantity > 0) {
    unitPrice = Number(unitPriceRaw) / quantity;
  } else {
    unitPrice = Number(unitPriceRaw);
  }

  if (!unitPrice) {
    unitPrice = 0;
  }

  const totalPrice = unitPrice * quantity;
  const iceLevel = normalizeIceLevel(item.iceLevel);

  let sweetness = "100%";
  if (item.sweetness) {
    sweetness = item.sweetness;
  }

  let toppings = [];
  if (Array.isArray(item.toppings)) {
    toppings = item.toppings;
  }

  let toppingDisplayNames = [];
  if (Array.isArray(item.toppingDisplayNames)) {
    toppingDisplayNames = item.toppingDisplayNames;
  } else if (Array.isArray(item.toppings)) {
    toppingDisplayNames = item.toppings;
  }

  return {
    drinkId,
    drinkName,
    imagePath,
    unitPrice,
    quantity,
    iceLevel,
    sweetness,
    toppings,
    toppingDisplayNames,
    totalPrice,
  };
}

function buildHistoryKey(orderId, idx, item) {
  let drinkId = "";
  if (item && item.drinkId) {
    drinkId = item.drinkId;
  } else if (item && item.drinkID) {
    drinkId = item.drinkID;
  } else if (item && item.drink_id) {
    drinkId = item.drink_id;
  }
  return `order-${orderId}-idx-${idx}-${drinkId}`;
}

function getDrinkIdFromHistory(item) {
  if (!item) {
    return null;
  }

  if (item.drinkId) {
    return item.drinkId;
  }

  if (item.drinkID) {
    return item.drinkID;
  }

  if (item.drink_id) {
    return item.drink_id;
  }

  return null;
}

async function fetchDrinkDetails(drinkId) {
  if (!drinkId) {
    return null;
  }

  try {
    const response = await fetch(`/api/kiosk/item/${drinkId}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch drink details", error);
    return null;
  }
}

function normalizeIceLevel(value) {
  if (!value) {
    return "Regular Ice";
  }

  const map = {
    Reg: "Regular Ice",
    Regular: "Regular Ice",
    "Regular Ice": "Regular Ice",
    Lt: "Light Ice",
    Light: "Light Ice",
    "Light Ice": "Light Ice",
    No: "No Ice",
    None: "No Ice",
    "No Ice": "No Ice",
    Ext: "Extra Ice",
    Extra: "Extra Ice",
    "Extra Ice": "Extra Ice",
  };

  const trimmed = String(value).trim();
  if (map[trimmed]) {
    return map[trimmed];
  }

  const upper = trimmed.toUpperCase();
  if (map[upper]) {
    return map[upper];
  }

  return trimmed;
}
