import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPanel from './components/cashier/views/LoginPanel.jsx';
import OrderPanel from './components/cashier/views/OrderPanel.jsx';
import HomePanel from './components/HomePanel.jsx';
import ManagerLogin from './components/manager/ManagerLogin.jsx';
import ManagerPanel from './components/manager/ManagerPanel.jsx';
// import './components/cashier/css/client.css';

function Client() {
    return (
        <BrowserRouter>
            <Routes>
                {/* set paths for cashier */}
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
    );
}






export default Client;

