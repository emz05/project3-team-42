/*
 * CustomizePage.jsx
 * -----------------------
 * - Lets kiosk users choose ice, sweetness, and toppings for a drink.
 * - Follows cashier structure exactly - no hardcoded data.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import { useCart } from "./CartContext.jsx";
import KioskCart from "./KioskCart.jsx";
import "../css/main.css";
import "../css/customize-page.css";

export default function CustomizePage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { addToCart } = useCart();

  const [drink, setDrink] = useState(null);

  // Default customization states (match cashier)
  const [iceLevel, setIceLevel] = useState("Reg");
  const [sweetness, setSweetness] = useState("100%");
  const [toppings, setToppings] = useState([]);

  // Ice level mapping: display text -> database value (4 char limit)
  const iceOptions = [
    { display: "Regular Ice", value: "Reg" },
    { display: "Light Ice", value: "Lt" },
    { display: "No Ice", value: "No" },
    { display: "Extra Ice", value: "Ext" }
  ];
  
  const sweetnessOptions = ["100%", "80%", "50%", "30%", "0%", "120%"];
  
  // Topping mapping: display text -> database value (4 char limit)
  const toppingOptions = [
    { display: "Boba", value: "Boba" },
    { display: "Jelly", value: "Jely" },  // 4 chars
    { display: "Ice Cream", value: "IceC" },  // 4 chars
    { display: "Condensed Milk", value: "Milk" }  // 4 chars
  ];

  // Fetch drink info from backend
  useEffect(() => {
    fetch(`/api/kiosk/item/${itemId}`)
      .then((res) => res.json())
      .then((data) => setDrink(data))
      .catch((err) => console.error("Failed to fetch drink:", err));
  }, [itemId]);

  if (!drink) return <div>Loading...</div>;

  // Toggle topping selection
  const toggleTopping = (topping) => {
    const isAlreadySelected = toppings.some(t => t.value === topping.value);

    if (isAlreadySelected) {
      setToppings(toppings.filter((t) => t.value !== topping.value));
    } else {
      setToppings([...toppings, topping]);
    }
  };

  // Add to cart - match cashier structure exactly
  const handleAddToCart = () => {
    const cartItem = {
      drinkId: drink.id,
      drinkName: drink.drink_name || drink.name,
      imagePath: drink.drink_image_path || drink.imagePath,
      unitPrice: drink.drink_price || drink.price,
      quantity: 1,
      iceLevel: iceLevel,
      sweetness: sweetness,
      toppings: toppings.map(t => t.value), // Store abbreviated values for DB
      toppingDisplayNames: toppings.map(t => t.display), // Store display names for UI
      totalPrice: drink.drink_price || drink.price,
    };

    addToCart(cartItem);

    // Reset to defaults after adding
    setIceLevel("Reg");
    setSweetness("100%");
    setToppings([]);
  };

  return (
    <div className="kiosk-container">
      <div className="kiosk-language-dropdown">
        <LanguageDropdown />
      </div>

      <h2>
        <TranslatedText text={"Customize Your Drink"} /> —{" "}
        <TranslatedText text={drink.drink_name || drink.name} />
      </h2>

      <div className="kiosk-options">
        {/* Ice Level Section */}
        <section>
          <h3>
            <TranslatedText text={"Ice Level"} />
          </h3>
          <div className="option-grid">
            {iceOptions.map((option) => (
              <button
                key={option.value}
                className={`option-btn ${
                  iceLevel === option.value ? "selected" : ""
                }`}
                onClick={() => setIceLevel(option.value)}
              >
                <TranslatedText text={option.display} />
              </button>
            ))}
          </div>
        </section>

        {/* Sweetness Level Section */}
        <section>
          <h3>
            <TranslatedText text={"Sweetness Level"} />
          </h3>
          <div className="option-grid">
            {sweetnessOptions.map((option) => (
              <button
                key={option}
                className={`option-btn ${
                  sweetness === option ? "selected" : ""
                }`}
                onClick={() => setSweetness(option)}
              >
                <TranslatedText text={option} />
              </button>
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
              <button
                key={option.value}
                className={`option-btn ${
                  toppings.some(t => t.value === option.value) ? "selected" : ""
                }`}
                onClick={() => toggleTopping(option)}
              >
                <TranslatedText text={option.display} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="kiosk-buttons">
        <button className="kiosk-nav" onClick={() => navigate(-1)}>
          <TranslatedText text={"Back to Items"} />
        </button>
        <button className="kiosk-action-button" onClick={handleAddToCart}>
          <TranslatedText text={"Add to Cart"} />
        </button>
        <button
          className="kiosk-action-button"
          onClick={() => navigate("/kiosk/review")}
        >
          <TranslatedText text={"Review Order"} />
        </button>
      </div>

      {/* Mini cart */}
      <KioskCart />
    </div>
  );
}