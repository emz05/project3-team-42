import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPanel from './components/cashier/views/LoginPanel.jsx';
import OrderPanel from './components/cashier/views/OrderPanel.jsx';
import HomePanel from './components/HomePanel.jsx';
// import './components/cashier/css/client.css';

function Client() {
    return (
        <BrowserRouter>
            <Routes>
                {/* set paths for cashier */}
                <Route path='/cashier/login' element={<LoginPanel/>}/>
                <Route path='/cashier/order' element={<OrderPanel/>}/>


                {/* set default page for landing and errors */}
                <Route path='/home' element={<HomePanel/>}/>
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
        </BrowserRouter>
    );
}






export default Client;


