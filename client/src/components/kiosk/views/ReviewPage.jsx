import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";

export default function ReviewPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  return (
    <div className="kiosk-container">
        <div className="kiosk-language-dropdown"><LanguageDropdown/></div>
      <h2><TranslatedText text={'Your Order'}/></h2>

      <div className="kiosk-summary">
        <p><strong><TranslatedText text={'Drink ID:'}/></strong> {state?.itemId}</p>
        <p><strong><TranslatedText text={'Size:'}/></strong> {state?.size}</p>
        <p><strong><TranslatedText text={'Sugar:'}/></strong> {state?.sugar}</p>
        <p><strong><TranslatedText text={'Ice:'}/></strong> {state?.ice}</p>
      </div>

      <button className="kiosk-button" onClick={() => navigate("/kiosk/confirmation")}>
          <TranslatedText text={'Confirm Order'}/>
      </button>

      <button className="kiosk-nav" onClick={() => navigate(-1)}>
          <TranslatedText text={'Back'}/>
      </button>
    </div>
  );
}
