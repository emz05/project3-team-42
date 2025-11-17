/*
 * PaymentConfirmation.jsx
 * -----------------------
 * - Displays a modal after a cashier completes payment.
 * - Shows order details and allows printing a receipt.
 */

import React, { useState } from 'react';
import TranslatedText from "../../common/TranslateText.jsx";
import '../css/order-panel.css';

const PaymentConfirmation = ({ orderNumber, total, onClose }) => {
    const [currentDate] = useState(new Date());          // timestamp for receipt
    const [phoneNumber, setPhoneNumber] = useState('');  // optional phone input

    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
                <div className="payment-success-icon">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="#10b981" />
                        <path d="M30 50 L45 65 L70 35" stroke="white" strokeWidth="6" fill="none" />
                    </svg>
                </div>

                <h2 className="payment-title">
                    <TranslatedText text="Payment Successful!" />
                </h2>

                {/* Transaction details section */}
                <div className="payment-details">
                    <h3 className="details-title">
                        <TranslatedText text="Transaction Details" />
                    </h3>

                    <div className="detail-row">
                        <span className="detail-label"><TranslatedText text="Order ID:" /></span>
                        <span className="detail-value">#{orderNumber}</span>
                    </div>
                    <div className="detail-divider" />

                    <div className="detail-row">
                        <span className="detail-label"><TranslatedText text="Date:" /></span>
                        <span className="detail-value">{currentDate.toLocaleDateString()}</span>
                    </div>
                    <div className="detail-divider" />

                    <div className="detail-row">
                        <span className="detail-label"><TranslatedText text="Time:" /></span>
                        <span className="detail-value">{currentDate.toLocaleTimeString()}</span>
                    </div>
                    <div className="detail-divider" />

                    <div className="detail-row">
                        <span className="detail-label"><TranslatedText text="Total:" /></span>
                        <span className="detail-value">${total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Phone + receipt print */}
                <div className="receipt-input-group">
                    <input
                        type="tel"
                        className="receipt-input"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                    />
                    <button className="receipt-button" onClick={handlePrintReceipt}>
                        <TranslatedText text="Print Receipt" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfirmation;
