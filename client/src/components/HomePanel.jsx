import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageDropdown from "./common/LanguageDropdown.jsx";
import './home-panel.css';

const HomePanel = () => {
    const navigate = useNavigate();

    return(
        <div className="button-container">
            <div className="admin-button">
                <button onClick={() => navigate('/manager')} style={{fontSize: '1.5em', fontWeight: 'bold'}}>Admin</button>
            </div>
            <div className="cashier-button">
                <button onClick={() => navigate('/cashier/login')} style={{fontSize: '1.5em', fontWeight: 'bold'}}>Cashier</button>
            </div>
            <div className="kiosk-button">
                <button onClick={() => navigate('/kiosk')} style={{fontSize: '1.5em', fontWeight: 'bold'}}>Kiosk</button>
            </div>
            <div className="language-dropdown">
                <LanguageDropdown />
            </div>
        </div>
    );
};

export default HomePanel;
