import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";

export default function ItemsPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  // temporary mock items
  const items = [
    { id: 101, name: "Classic Milk Tea" },
    { id: 102, name: "Taro Milk Tea" },
    { id: 103, name: "Matcha Latte" },
  ];

  return (
    <div className="kiosk-container">
        <div className="kiosk-language-dropdown"><LanguageDropdown/></div>
      <h2><TranslatedText text={'Select a Drink'}/></h2>

      <div className="kiosk-grid">
        {items.map((item) => (
          <div
            key={item.id}
            className="kiosk-card"
            onClick={() => navigate(`/kiosk/item/${item.id}/customize`)}
          >
            <h3><TranslatedText text={item.name}/></h3>
          </div>
        ))}
      </div>

      <button className="kiosk-nav" onClick={() => navigate("/kiosk/categories")}>
          <TranslatedText text={'Back to Categories'}/>
      </button>
    </div>
  );
}
