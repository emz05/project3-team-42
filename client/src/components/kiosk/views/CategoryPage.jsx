/*
 * CategoryPage.jsx
 * -----------------------
 * - Displays drink categories for the kiosk.
 * - Users tap a category to navigate to its item list.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";

export default function CategoriesPage() {
  const navigate = useNavigate();

  // Static list of kiosk categories
  const categories = [
    { id: 1, name: "Milk Tea" },
    { id: 2, name: "Fruit Tea" },
    { id: 3, name: "Smoothies" },
    { id: 4, name: "Seasonal Specials" },
  ];

  return (
    <div className="kiosk-container">
      {/* Language selector for kiosk users */}
      <div className="kiosk-language-dropdown"><LanguageDropdown/></div>

      <h2><TranslatedText text={'Select a Category'}/></h2>

      {/* Grid of category buttons */}
      <div className="kiosk-grid">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="kiosk-card"
            onClick={() => navigate(`/kiosk/categories/${cat.id}`)}
          >
            <h3><TranslatedText text={cat.name}/></h3>
          </div>
        ))}
      </div>
    </div>
  );
}
