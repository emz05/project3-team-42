/*
 * ItemPage.jsx
 * -----------------------
 * - Displays drinks for the selected category.
 * - Matches cashier DrinkCard structure with currency formatting.
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import currency from "currency.js";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import "../css/main.css";

export default function ItemPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`/api/kiosk/categories/${encodeURIComponent(categoryId)}/drinks`)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error("Failed to fetch drinks:", err));
  }, [categoryId]);

  return (
    <div className="kiosk-container">
      <div className="kiosk-language-dropdown">
        <LanguageDropdown />
      </div>

      <h2>
        <TranslatedText text={"Select a Drink"} /> —{" "}
        <TranslatedText text={categoryId} />
      </h2>

      <div className="kiosk-grid">
        {items.map((item) => {
          // Handle both naming conventions from backend
          const imageURL = `/${item.drink_image_path || item.imagePath || "vite.svg"}`;
          const drinkName = item.drink_name || item.name;
          const drinkPrice = item.drink_price || item.price;
          const formattedPrice = currency(drinkPrice).format();

          return (
            <div
              key={item.id}
              className="kiosk-card"
              onClick={() => navigate(`/kiosk/item/${item.id}/customize`)}
            >
              <img
                src={imageURL}
                alt={drinkName}
                className="kiosk-drink-image"
              />
              <h3>
                <TranslatedText text={drinkName} />
              </h3>
              <p>{formattedPrice}</p>
            </div>
          );
        })}
      </div>

      <button
        className="kiosk-nav"
        onClick={() => navigate("/kiosk/categories")}
      >
        <TranslatedText text={"Back to Categories"} />
      </button>
    </div>
  );
}