import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPanel from './components/cashier/views/LoginPanel.jsx';
import OrderPanel from './components/cashier/views/OrderPanel.jsx';
import HomePanel from './components/HomePanel.jsx';
import KioskHomePage from './components/kiosk/views/HomePage.jsx';
import CategoryPage from './components/kiosk/views/CategoryPage.jsx';
import ItemPage from './components/kiosk/views/ItemPage.jsx';
import CustomizePage from './components/kiosk/views/CustomizePage.jsx';
import ReviewPage from './components/kiosk/views/ReviewPage.jsx';
import ConfirmationPage from './components/kiosk/views/ConfirmationPage.jsx';

// import './components/cashier/css/client.css';

function Client() {
    return (
        <BrowserRouter>
            <Routes>
                {/* set paths for cashier */}
                <Route path='/cashier/login' element={<LoginPanel />} />
                <Route path='/cashier/order' element={<OrderPanel />} />

                {/* kiosk */}
                <Route path='/kiosk' element={<KioskHomePage />} />
                <Route path='/kiosk/categories' element={<CategoryPage />} />
                <Route path='/kiosk/categories/:categoryId' element={<ItemPage />} />
                <Route path='/kiosk/item/:itemId/customize' element={<CustomizePage />} />
                <Route path='/kiosk/review' element={<ReviewPage />} />
                <Route path='/kiosk/confirmation' element={<ConfirmationPage />} />

                {/* default home and error pages */}
                <Route path='/home' element={<HomePanel />} />
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default Client;
