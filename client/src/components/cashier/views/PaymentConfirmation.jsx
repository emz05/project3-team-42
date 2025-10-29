import React, { useState, useEffect } from 'react';
import '../css/order-panel.css';

const PaymentConfirmation = ({ orderNumber, total, onClose }) => {
    const [currentDate] = useState(new Date());

    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
                <div className="payment-success-icon">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="#10b981" />
                        <path d="M30 50 L45 65 L70 35" stroke="white" strokeWidth="6" fill="none" />
                    </svg>
                </div>
                <h2 className="payment-title">Payment Successful!</h2>

                <div className="payment-details">
                    <h3 className="details-title">Transaction Details</h3>

                    <div className="detail-row">
                        <span className="detail-label">Order ID:</span>
                        <span className="detail-value">#{orderNumber}</span>
                    </div>
                    <div className="detail-divider" />

                    <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{currentDate.toLocaleDateString()}</span>
                    </div>
                    <div className="detail-divider" />

                    <div className="detail-row">
                        <span className="detail-label">Time:</span>
                        <span className="detail-value">{currentDate.toLocaleTimeString()}</span>
                    </div>
                    <div className="detail-divider" />

                    <div className="detail-row">
                        <span className="detail-label">Total:</span>
                        <span className="detail-value">${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfirmation;