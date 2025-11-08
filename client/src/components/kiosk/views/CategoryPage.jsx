import React from "react";
import { useNavigate } from "react-router-dom";

export default function CategoriesPage() {
  const navigate = useNavigate();

  const categories = [
    { id: 1, name: "Milk Tea" },
    { id: 2, name: "Fruit Tea" },
    { id: 3, name: "Smoothies" },
    { id: 4, name: "Seasonal Specials" },
  ];

  return (
    <div className="kiosk-container">
      <h2>Select a Category</h2>

      <div className="kiosk-grid">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="kiosk-card"
            onClick={() => navigate(`/kiosk/categories/${cat.id}`)}
          >
            <h3>{cat.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
