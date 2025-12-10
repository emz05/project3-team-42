/*
 * ItemPage.jsx
 * -----------------------
 * - Displays drinks for the selected category with descriptions.
 * - Shows allergen info and expandable descriptions.
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import currency from "currency.js";
import TranslatedText from "../../common/TranslateText.jsx";
import "../css/main.css";
import "../css/item-descriptions.css";
import "../css/contrast-toggle.css";
import KioskHeader from "../components/KioskHeader.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";
import { api } from "../../../services/api.js"

export default function ItemPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [items, setItems] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);

  // Page-level TTS summary
  usePageSpeech(`Select a drink in the category ${categoryId}.`);

  useEffect(() => {
      api.get(`/kiosk/categories/${encodeURIComponent(categoryId)}/drinks`)
      .then((res) => {
        console.log("Received drinks:", res.data);
        setItems(res.data);
      })
      .catch((err) => console.error("Failed to fetch drinks:", err));
  }, [categoryId]);

  const toggleDescription = (itemId, event) => {
    event.stopPropagation(); // Prevent navigation when clicking toggle
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  return (
    <div className="kiosk-page">
      <KioskHeader />

      <div className="kiosk-container">
        <h2>
          <TranslatedText text={"Select a Drink"} /> —{" "}
          <TranslatedText text={categoryId} />
        </h2>

        <div className="kiosk-drinks-list">
          {items.map((item) => {
            const imageURL = `/${item.drink_image_path || item.imagePath || "vite.svg"}`;
            const drinkName = item.drink_name || item.name;
            const drinkPrice = item.drink_price || item.price;
            const formattedPrice = currency(drinkPrice).format();
            const description = item.description || "";
            const allergens = item.allergens || "";
            const isExpanded = expandedItem === item.id;

            const speechText = `${drinkName}, ${formattedPrice}${
              description ? `. ${description}` : ""
            }${allergens ? `. Contains ${allergens}` : ""}`;

            return (
              <SpeakOnHover text={speechText} key={item.id}>
                <div className="drink-list-item">
                  {/* Left: Image */}
                  <div className="drink-item-image-container">
                    <img
                      src={imageURL}
                      alt={drinkName}
                      className="drink-item-image"
                    />
                  </div>

                  {/* Middle: Info */}
                  <div className="drink-item-info">
                    <h3 className="drink-item-name">
                      <TranslatedText text={drinkName} />
                    </h3>
                    <p className="drink-item-price">{formattedPrice}</p>

                    {/* Description preview or full */}
                    {description && (
                      <div className="drink-item-description">
                        <p className={isExpanded ? "expanded" : "collapsed"}>
                          <TranslatedText text={description} />
                        </p>
                        {description.length > 80 && (
                          <button
                            className="description-toggle"
                            onClick={(e) => toggleDescription(item.id, e)}
                          >
                            <TranslatedText
                              text={isExpanded ? "Show Less" : "Read More"}
                            />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Allergens */}
                    {allergens && (
                      <div className="drink-item-allergens">
                        <span className="allergen-icon">⚠️</span>
                        <span className="allergen-text">
                          <TranslatedText text={allergens} />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Order Button */}
                  <div className="drink-item-action">
                    <button
                      className="order-drink-button"
                      onClick={() => navigate(`/kiosk/item/${item.id}/customize`)}
                    >
                      <TranslatedText text={"Order"} />
                    </button>
                  </div>
                </div>
              </SpeakOnHover>
            );
          })}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <SpeakOnHover text="Back to categories">
            <button
              className="kiosk-nav"
              onClick={() => navigate("/kiosk/categories")}
            >
              <TranslatedText text={"Back to Categories"} />
            </button>
          </SpeakOnHover>
        </div>
      </div>
    </div>
  );
}