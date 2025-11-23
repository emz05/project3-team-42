/*
 * CategoryPage.jsx
 * -----------------------
 * - Fetches drink categories from the kiosk backend.
 * - Users tap a category to navigate to its item list.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import ContrastToggle from "./ContrastToggle.jsx";
import "../css/main.css";
import "../css/contrast-toggle.css";

export default function CategoryPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("/api/kiosk/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  return (
    <div className="kiosk-container">
      <ContrastToggle />
      <div className="kiosk-language-dropdown"><LanguageDropdown /></div>

      <h2><TranslatedText text={"Select a Category"} /></h2>

      <div className="kiosk-grid">
        {categories.map((cat, index) => (
          <div
            key={index}
            className="kiosk-card"
            onClick={() => navigate(`/kiosk/categories/${encodeURIComponent(cat.name)}`)}
          >
            <h3><TranslatedText text={cat.name} /></h3>
          </div>
        ))}
      </div>
    </div>
  );
}