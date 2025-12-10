/*
 * CustomizePage.jsx
 * -----------------------
 * - Lets kiosk users choose ice, sweetness, and toppings for a drink.
 * - Follows cashier structure exactly - no hardcoded data.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TranslatedText from "../../common/TranslateText.jsx";
import { useCart } from "./CartContext.jsx";
import KioskCart from "./KioskCart.jsx";

import "../css/main.css";
import "../css/customize-page.css";
import "../css/contrast-toggle.css";

import KioskHeader from "../components/KioskHeader.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";

import { api } from "../../../services/api.js";

export default function CustomizePage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { addToCart } = useCart();

  const [drink, setDrink] = useState(null);

  // Default customization states (match cashier)
  const [temperature, setTemperature] = useState("Iced");
  const [size, setSize] = useState("Medium");
  const [iceLevel, setIceLevel] = useState("Reg");
  const [sweetness, setSweetness] = useState("100%");
  const [toppings, setToppings] = useState([]);

  // Ice level mapping: display text -> database value (4 char limit)
  const iceOptions = [
    { display: "Regular Ice", value: "Reg" },
    { display: "Light Ice", value: "Lt" },
    { display: "No Ice", value: "No" },
    { display: "Extra Ice", value: "Ext" },
  ];
  const sizeOptions = ["Small", "Medium", "Large"];
  const sizeUpcharge = {
    Small: 0,
    Medium: 0.5,
    Large: 1,
  };
  const temperatureOptions = ["Iced", "Hot"];

  useEffect(() => {
    if (drink && drink.category === "Milk Tea" && temperature === "Hot") {
      setIceLevel("");
    } else if (!iceLevel) {
      setIceLevel("Reg");
    }
  }, [drink, temperature, iceLevel]);

  const sweetnessOptions = ["100%", "80%", "50%", "30%", "0%", "120%"];

  // Topping mapping: display text -> database value (4 char limit)
  const toppingOptions = [
    { display: "Boba", value: "Boba" },
    { display: "Jelly", value: "Jely" },
    { display: "Ice Cream", value: "IceC" },
    { display: "Condensed Milk", value: "Milk" },
  ];

  // Fetch drink info from backend
  useEffect(() => {
   api.get(`/kiosk/item/${itemId}`)
      .then((res) => setDrink(res.data))
      .catch((err) => console.error("Failed to fetch drink:", err));
  }, [itemId]);

  // 🔊 Spoken summary for this page (must be before any early return)
  usePageSpeech(
    drink
      ? "Customize your drink. Choose an ice level, a sweetness level, and optional toppings."
      : "Loading drink details."
  );

  // While loading, still show header so the layout doesn’t feel broken
  if (!drink) {
    return (
      <div className="kiosk-page">
        <KioskHeader />
        <div className="kiosk-container">
          <p>
            <TranslatedText text="Loading drink..." />
          </p>
        </div>
      </div>
    );
  }

  // Toggle topping selection
  const toggleTopping = (topping) => {
    const isAlreadySelected = toppings.some((t) => t.value === topping.value);

    if (isAlreadySelected) {
      setToppings(toppings.filter((t) => t.value !== topping.value));
    } else {
      setToppings([...toppings, topping]);
    }
  };

  // Add to cart - match cashier structure exactly
  const handleAddToCart = () => {
    const basePrice = Number(drink.drink_price || drink.price || 0);
    const unitPrice = basePrice + (sizeUpcharge[size] || 0);

    const cartItem = {
      drinkId: drink.id,
      drinkName: drink.drink_name || drink.name,
      imagePath: drink.drink_image_path || drink.imagePath,
      unitPrice,
      quantity: 1,
      temperature: drink.category === "Milk Tea" ? temperature : undefined,
      size,
      iceLevel: iceLevel,
      sweetness: sweetness,
      toppings: toppings.map((t) => t.value), // abbreviated values for DB
      toppingDisplayNames: toppings.map((t) => t.display), // display names for UI
      totalPrice: unitPrice,
    };

    addToCart(cartItem);

    // Reset to defaults after adding
    setTemperature("Iced");
    setSize("Medium");
    setIceLevel("Reg");
    setSweetness("100%");
    setToppings([]);
  };

  return (
    <div className="kiosk-page">
      <KioskHeader />

      <div className="customize-title">
        <div className="customize-title-label">
          <TranslatedText text={"Customize Your Drink"} />
        </div>
        <div className="customize-drink-name">
          <TranslatedText text={drink.drink_name || drink.name} />
        </div>
      </div>

      <div className="kiosk-options">
        {drink.category === "Milk Tea" && (
          <section>
            <h3>
              <TranslatedText text={"Temperature"} />
            </h3>
            <div className="option-grid">
              {temperatureOptions.map((option) => (
                <SpeakOnHover text={option} key={option}>
                  <button
                    className={`option-btn ${
                      temperature === option ? "selected" : ""
                    }`}
                    onClick={() => setTemperature(option)}
                  >
                    <TranslatedText text={option} />
                  </button>
                </SpeakOnHover>
              ))}
            </div>
          </section>
        )}

        {/* Size Section */}
        <section>
          <h3>
            <TranslatedText text={"Size"} />
          </h3>
          <div className="option-grid">
            {sizeOptions.map((option) => (
              <SpeakOnHover text={option} key={option}>
                <button
                  className={`option-btn ${size === option ? "selected" : ""}`}
                  onClick={() => setSize(option)}
                >
                  <TranslatedText text={option} />
                </button>
              </SpeakOnHover>
            ))}
          </div>
        </section>

        {/* Ice Level Section */}
        {!(drink.category === "Milk Tea" && temperature === "Hot") && (
          <section>
            <h3>
              <TranslatedText text={"Ice Level"} />
            </h3>
            <div className="option-grid">
              {iceOptions.map((option) => (
                <SpeakOnHover text={option.display} key={option.value}>
                  <button
                    className={`option-btn ${
                      iceLevel === option.value ? "selected" : ""
                    }`}
                    onClick={() => setIceLevel(option.value)}
                  >
                    <TranslatedText text={option.display} />
                  </button>
                </SpeakOnHover>
              ))}
            </div>
          </section>
        )}

        {/* Sweetness Level Section */}
        <section>
          <h3>
            <TranslatedText text={"Sweetness Level"} />
          </h3>
          <div className="option-grid">
            {sweetnessOptions.map((option) => (
              <SpeakOnHover text={`${option} sweetness`} key={option}>
                <button
                  className={`option-btn ${
                    sweetness === option ? "selected" : ""
                  }`}
                  onClick={() => setSweetness(option)}
                >
                  <TranslatedText text={option} />
                </button>
              </SpeakOnHover>
            ))}
          </div>
        </section>

        {/* Toppings Section */}
        <section>
          <h3>
            <TranslatedText text={"Toppings"} />
          </h3>
          <div className="option-grid">
            {toppingOptions.map((option) => (
              <SpeakOnHover text={option.display} key={option.value}>
                <button
                  className={`option-btn ${
                    toppings.some((t) => t.value === option.value)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => toggleTopping(option)}
                >
                  <TranslatedText text={option.display} />
                </button>
              </SpeakOnHover>
            ))}
          </div>
        </section>
      </div>

      <div className="kiosk-buttons">
        <SpeakOnHover text="Back to items">
          <button className="kiosk-nav-items" onClick={() => navigate(-1)}>
            <TranslatedText text={"Back to Items"} />
          </button>
        </SpeakOnHover>

        <SpeakOnHover text="Add to cart">
          <button className="kiosk-action-button" onClick={handleAddToCart}>
            <TranslatedText text={"Add to Cart"} />
          </button>
        </SpeakOnHover>

        <SpeakOnHover text="Review order">
          <button
            className="kiosk-action-button"
            onClick={() => navigate("/kiosk/review")}
          >
            <TranslatedText text={"Review Order"} />
          </button>
        </SpeakOnHover>
      </div>

      {/* Mini cart */}
      <KioskCart />
    </div>
  );
}
