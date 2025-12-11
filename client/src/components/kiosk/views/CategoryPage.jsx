/*
 * CategoryPage.jsx
 * -----------------------
 * - Fetches drink categories from the kiosk backend.
 * - Users tap a category to navigate to its item list.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TranslatedText from "../../common/TranslateText.jsx";

import "../css/main.css";
import "../css/contrast-toggle.css";

import KioskHeader from "../components/KioskHeader.jsx";
import SpeakOnHover from "../components/SpeakOnHover.jsx";
import usePageSpeech from "../../../hooks/usePageSpeech.jsx";

import { api } from "../../../services/api.js";

export default function CategoryPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  // Page-level spoken summary
  usePageSpeech("Select a drink category to get started.");

  useEffect(() => {
      api.get("/kiosk/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  return (
    <div className="kiosk-page">
      <KioskHeader />

      <div className="kiosk-container">
        <h2>
          <TranslatedText text={"Select a Category"} />
        </h2>

        <div className="kiosk-grid">
          {categories.map((cat, index) => (
            <SpeakOnHover text={cat.name} key={index}>
              <div
                className="kiosk-card"
                onClick={() =>
                  navigate(`/kiosk/categories/${encodeURIComponent(cat.name)}`)
                }
              >
                <h3>
                  <TranslatedText text={cat.name} />
                </h3>
              </div>
            </SpeakOnHover>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <SpeakOnHover text="Back to start">
            <button
              className="kiosk-nav"
              onClick={() => navigate("/kiosk/start")}
            >
              <TranslatedText text={"Back to Start"} />
            </button>
          </SpeakOnHover>
        </div>
      </div>
    </div>
  );
}
