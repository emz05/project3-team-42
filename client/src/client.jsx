import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TranslationWrapper} from "./context/translation-storage.jsx";
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPanel from './components/cashier/views/LoginPanel.jsx';
import OrderPanel from './components/cashier/views/OrderPanel.jsx';
import HomePanel from './components/HomePanel.jsx';
import KioskHomePage from './components/kiosk/views/HomePage.jsx';
import CategoryPage from './components/kiosk/views/CategoryPage.jsx';
import ItemPage from './components/kiosk/views/ItemPage.jsx';
import CustomizePage from './components/kiosk/views/CustomizePage.jsx';
import ReviewPage from './components/kiosk/views/ReviewPage.jsx';
import ConfirmationPage from './components/kiosk/views/ConfirmationPage.jsx';
import PayPage from './components/common/PayPage.jsx';

import ManagerLogin from './components/manager/ManagerLogin.jsx';
import ManagerPanel from './components/manager/ManagerPanel.jsx';
import { ManagerAuthProvider, useManagerAuth } from './components/manager/ManagerAuthContext.jsx';
// import './components/cashier/css/client.css';

const ManagerProtectedRoute = ({ children }) => {
  const { isAuthorized } = useManagerAuth();
  if (!isAuthorized) {
    return <Navigate to="/manager/login" replace />;
  }
  return children;
};

function Client() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  if (!googleClientId) {
    console.warn('Missing VITE_GOOGLE_CLIENT_ID environment variable. Google login will not work.');
  }

  return (
      <TranslationWrapper>
        <GoogleOAuthProvider clientId={googleClientId}>
          <ManagerAuthProvider>
            <BrowserRouter>
              <Routes>
                {/* set paths for cashier */}
                <Route path="/cashier/login" element={<LoginPanel />} />
                <Route path="/cashier/order" element={<OrderPanel />} />
                  <Route path="/pay/:paymentId" element={<PayPage />} />

                {/* kiosk */}
                <Route path="/kiosk" element={<KioskHomePage />} />
                <Route path="/kiosk/categories" element={<CategoryPage />} />
                <Route path="/kiosk/categories/:categoryId" element={<ItemPage />} />
                <Route path="/kiosk/item/:itemId/customize" element={<CustomizePage />} />
                <Route path="/kiosk/review" element={<ReviewPage />} />
                <Route path="/kiosk/confirmation" element={<ConfirmationPage />} />

                {/* default home and error pages */}
                <Route path="/home" element={<HomePanel />} />
                <Route path="/cashier/login" element={<LoginPanel />} />
                <Route path="/cashier/order" element={<OrderPanel />} />

                {/* manager login + panel */}
                <Route path="/manager/login" element={<ManagerLogin />} />
                {/* keep existing Admin link working as alias */}
                <Route path="/admin/login" element={<ManagerLogin />} />
                <Route
                  path="/manager"
                  element={(
                    <ManagerProtectedRoute>
                      <ManagerPanel />
                    </ManagerProtectedRoute>
                  )}
                />

                {/* set default page for landing and errors */}
                <Route path="/home" element={<HomePanel />} />
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="*" element={<Navigate to="/home" />} />
              </Routes>
            </BrowserRouter>
          </ManagerAuthProvider>
        </GoogleOAuthProvider>
      </TranslationWrapper>
  );
}






export default Client;


