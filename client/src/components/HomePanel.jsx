import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePanel = () => {
    const navigate = useNavigate();

    return(
        <div className="button-container">
            <div className="admin-button">
                <button onClick={() => navigate('/admin/login')}>Admin</button>
            </div>
            <div className="cashier-button">
                <button onClick={() => navigate('/cashier/login')}>Cashier</button>
            </div>
            <div className="kiosk-button">
                <button onClick={() => navigate('/kiosk')}>Kiosk</button>
            </div>
        </div>
    );
};

export default HomePanel;