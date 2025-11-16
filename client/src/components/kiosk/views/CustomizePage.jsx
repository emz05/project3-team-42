import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";

export default function CustomizePage() {
  const navigate = useNavigate();
  const { itemId } = useParams();

  const [size, setSize] = useState("Medium");
  const [sugar, setSugar] = useState("50%");
  const [ice, setIce] = useState("50%");

  return (
    <div className="kiosk-container">
        <div className="kiosk-language-dropdown"><LanguageDropdown/></div>
      <h2><TranslatedText text={'Customize Your Drink'}/></h2>

      <div className="kiosk-options">
        <label><TranslatedText text={'Size:'}/></label>
        <select value={size} onChange={(e) => setSize(e.target.value)}>
          <option><TranslatedText text={'Small'}/></option>
          <option><TranslatedText text={'Medium'}/></option>
          <option><TranslatedText text={'Large'}/></option>
        </select>

        <label><TranslatedText text={'Sugar:'}/></label>
        <select value={sugar} onChange={(e) => setSugar(e.target.value)}>
          <option>0%</option>
          <option>25%</option>
          <option>50%</option>
          <option>75%</option>
          <option>100%</option>
        </select>

        <label><TranslatedText text={'Ice:'}/></label>
        <select value={ice} onChange={(e) => setIce(e.target.value)}>
          <option>0%</option>
          <option>25%</option>
          <option>50%</option>
          <option>75%</option>
          <option>100%</option>
        </select>
      </div>

      <button
        className="kiosk-button"
        onClick={() => navigate("/kiosk/review", { state: { itemId, size, sugar, ice } })}
      >
          <TranslatedText text={'Review Order'}/>
      </button>

      <button className="kiosk-nav" onClick={() => navigate(-1)}>
          <TranslatedText text={'Back'}/>
      </button>
    </div>
  );
}
