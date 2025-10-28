import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tabs from './Tabs';

const OrderPanel = () => {
    const [employee, setEmployee] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loggedEmployee = sessionStorage.getItem('employee');
        if(loggedEmployee) { setEmployee(JSON.parse(loggedEmployee)) }
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('employee');
        navigate('/login');
    };

    if (!employee) { return <p></p>; }


    return (
        <div className="order-container">
            <header>
                <h1>Order Panel</h1>
                <div className="user-info">
                    <span>Welcome, {employee.firstName} {employee.lastName}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main>
                <p>Role: {employee.role}</p>

                <div className="tabs-container"><Tabs /></div>
            </main>
        </div>
    );
};

export default OrderPanel;