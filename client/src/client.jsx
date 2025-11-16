import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TranslationWrapper} from "./context/translation-storage.jsx";

import LoginPanel from './components/cashier/views/LoginPanel.jsx';
import OrderPanel from './components/cashier/views/OrderPanel.jsx';
import HomePanel from './components/HomePanel.jsx';
import KioskHomePage from './components/kiosk/views/HomePage.jsx';
import CategoryPage from './components/kiosk/views/CategoryPage.jsx';
import ItemPage from './components/kiosk/views/ItemPage.jsx';
import CustomizePage from './components/kiosk/views/CustomizePage.jsx';
import ReviewPage from './components/kiosk/views/ReviewPage.jsx';
import ConfirmationPage from './components/kiosk/views/ConfirmationPage.jsx';

import ManagerLogin from './components/manager/ManagerLogin.jsx';
import ManagerPanel from './components/manager/ManagerPanel.jsx';
// import './components/cashier/css/client.css';

function Client() {
    return (
        <TranslationWrapper>
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
                    <Route path='/cashier/login' element={<LoginPanel/>}/>
                    <Route path='/cashier/order' element={<OrderPanel/>}/>

                    {/* manager placeholder login + panel */}
                    <Route path='/manager/login' element={<ManagerLogin/>} />
                    {/* keep existing Admin link working as alias */}
                    <Route path='/admin/login' element={<ManagerLogin/>} />
                    <Route path='/manager' element={<ManagerPanel/>} />

                    {/* set default page for landing and errors */}
                    <Route path='/home' element={<HomePanel/>}/>
                    <Route path="/" element={<Navigate to="/home" />} />
                    <Route path="*" element={<Navigate to="/home" />} />
                </Routes>
            </BrowserRouter>
        </TranslationWrapper>
    );
}

export default Client;

