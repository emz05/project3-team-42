import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../../services/api.js';
import '../css/login-panel.css';


const LoginPanel = () => {
    const [password, setPassword] = useState('');
    const [error, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const addDigit = (digit) => {
        if (password.length < 6) {
            const updatePassword = password + digit;
            setPassword(updatePassword);

            if (updatePassword.length === 6) {
                handleLogin(updatePassword);
                //setTimeout(() => handleLogin(updatePassword), 50);
            }
        }
    };

    const deleteDigit = () => {
        if (password.length > 0) {
            setPassword(password.slice(0, -1));
            setErrorMessage('');
        }
    };

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

    const createPasswordDots = () => {
        const dots = [];
        return Array.from({ length: 6 }).map((_, i) => {
            const toFill = i < password.length;
            let dotClass = 'dot';
            if (toFill) {
                dotClass += ' filled';
            }

            return <div key={i} className={dotClass}></div>;
        });
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <div> ♔ </div>
                    <div className="login-title">Enter your employee ID</div>
                </div>

                <div className="dots-container"> {createPasswordDots()} </div>

                {error && <div className="error-message"> {error} </div>}

                <div className="number-pad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            className="num-btn"
                            onClick={() => addDigit(String(num))}
                        >
                            {num}
                        </button>
                    ))}

                    <div></div>

                    <button
                        className="num-btn"
                        onClick={() => addDigit('0')}
                    >
                        0
                    </button>

                    <button
                        className="delete-btn"
                        onClick={deleteDigit}
                    >
                        ⌫
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPanel;