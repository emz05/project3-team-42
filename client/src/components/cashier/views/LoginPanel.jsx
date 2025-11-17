/*
 * LoginPanel.jsx
 * -----------------------
 * - Cashier login screen using a 6-digit employee ID keypad.
 * - Submits the ID automatically when all digits are entered.
 * - Stores logged-in employee info in sessionStorage.
 */

import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../../services/api.js';
import '../css/login-panel.css';
import TranslatedText from "../../common/TranslateText.jsx";

const LoginPanel = () => {
    const [password, setPassword] = useState('');
    const [error, setErrorMessage] = useState('');
    const navigate = useNavigate();

    // Add a digit to the employee ID input
    const addDigit = (digit) => {
        if (password.length < 6) {
            const updatePassword = password + digit;
            setPassword(updatePassword);

            // Auto-submit once 6 digits are entered
            if (updatePassword.length === 6) {
                handleLogin(updatePassword);
            }
        }
    };

    // Remove last digit
    const deleteDigit = () => {
        if (password.length > 0) {
            setPassword(password.slice(0, -1));
            setErrorMessage('');
        }
    };

    // Validate employee ID using backend API
    const handleLogin = async (employeeID) => {
        setErrorMessage('');

        try {
            const employee = await employeeAPI.login(employeeID);
            sessionStorage.setItem('employee', JSON.stringify(employee.data));
            navigate('/cashier/order');
        } catch (error) {
            setErrorMessage('Invalid employee ID');
            setPassword('');
        }
    };

    // Builds the 6 password indicator dots
    const createPasswordDots = () => {
        return Array.from({ length: 6 }).map((_, i) => {
            const filled = i < password.length;
            return <div key={i} className={filled ? 'dot filled' : 'dot'}></div>;
        });
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <div> ♔ </div>
                    <div className="login-title">
                        <TranslatedText text={"Enter your employee ID"} />
                    </div>
                </div>

                <div className="dots-container">
                    {createPasswordDots()}
                </div>

                {error && (
                    <div className="error-message">
                        <TranslatedText text={error} />
                    </div>
                )}

                {/* 0–9 keypad */}
                <div className="number-pad">
                    {[1,2,3,4,5,6,7,8,9].map((num) => (
                        <button
                            key={num}
                            className="num-btn"
                            onClick={() => addDigit(String(num))}
                        >
                            {num}
                        </button>
                    ))}

                    <div></div>

                    <button className="num-btn" onClick={() => addDigit('0')}>
                        0
                    </button>

                    <button className="delete-btn" onClick={deleteDigit}>
                        ⌫
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPanel;