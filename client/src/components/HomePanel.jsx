import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageDropdown from "./common/LanguageDropdown.jsx";
import './home-panel.css';
import { useTranslation } from "../context/translation-storage.jsx";
import TranslatedText from "./common/TranslateText.jsx";

const HomePanel = () => {
    const navigate = useNavigate();
    const { translate } = useTranslation();

    return(
        <div className="button-container">
            <div className="admin-button">
                <button onClick={() => navigate('/manager')} style={{fontSize: '1.5em', fontWeight: 'bold'}}><TranslatedText text={"Admin"}/></button>
            </div>
            <div className="cashier-button">
                <button onClick={() => navigate('/cashier/login')} style={{fontSize: '1.5em', fontWeight: 'bold'}}><TranslatedText text={"Cashier"}/></button>
            </div>
            <div className="kiosk-button">
                <button onClick={() => navigate('/kiosk')} style={{fontSize: '1.5em', fontWeight: 'bold'}}><TranslatedText text={"Kiosk"}/></button>
            </div>
            <div className="language-dropdown">
                <LanguageDropdown />
            </div>
        </div>
    );
};

export default HomePanel;
