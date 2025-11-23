/*
 * PaymentPage.jsx
 * -----------------------
 * - Integrated payment page for kiosk orders
 * - Simulates card payment with validation
 * - Processes order and navigates to confirmation
 * - Matches your existing design system
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext.jsx';
import LanguageDropdown from '../../common/LanguageDropdown.jsx';
import TranslatedText from '../../common/TranslateText.jsx';
import currency from 'currency.js';
import '../css/payment-page.css';

const normalizeIceLevel = (value) => {
  if (!value) {
    return '';
  }

  const map = {
    Reg: 'Regular Ice',
    Regular: 'Regular Ice',
    'Regular Ice': 'Regular Ice',
    Lt: 'Light Ice',
    Light: 'Light Ice',
    'Light Ice': 'Light Ice',
    No: 'No Ice',
    None: 'No Ice',
    'No Ice': 'No Ice',
    Ext: 'Extra Ice',
    Extra: 'Extra Ice',
    'Extra Ice': 'Extra Ice',
  };

  const trimmed = String(value).trim();
  if (map[trimmed]) {
    return map[trimmed];
  }
  if (map[trimmed.toUpperCase()]) {
    return map[trimmed.toUpperCase()];
  }
  return trimmed;
};

const summarizeCartForReceipt = (items = []) => {
  return items.map((item) => {
    let drinkName = '';
    if (item.drinkName) {
      drinkName = item.drinkName;
    } else {
      let drinkId = '';
      if (item.drinkId) {
        drinkId = item.drinkId;
      }
      drinkName = `Drink #${drinkId}`;
    }

    let size = '';
    if (item.size) {
      size = item.size;
    }

    let sugar = '';
    if (item.sweetness) {
      sugar = item.sweetness;
    }

    let toppings = [];
    if (Array.isArray(item.toppingDisplayNames)) {
      toppings = item.toppingDisplayNames.filter(Boolean);
    } else if (Array.isArray(item.toppings)) {
      toppings = item.toppings.filter(Boolean);
    }

    return {
      drinkName,
      size,
      sugar,
      ice: normalizeIceLevel(item.iceLevel),
      toppings,
    };
  });
};

const snapshotCartForStorage = (items = []) => {
  return items.map((item) => {
    let drinkName = '';
    if (item.drinkName) {
      drinkName = item.drinkName;
    } else if (item.name) {
      drinkName = item.name;
    } else {
      let drinkId = '';
      if (item.drinkId) {
        drinkId = item.drinkId;
      }
      drinkName = `Drink #${drinkId}`;
    }

    let unitPriceValue = 0;
    if (item.unitPrice) {
      unitPriceValue = item.unitPrice;
    } else if (item.totalPrice) {
      unitPriceValue = item.totalPrice;
    }

    let quantityValue = 1;
    if (item.quantity) {
      quantityValue = item.quantity;
    }

    let size = '';
    if (item.size) {
      size = item.size;
    } else if (item.selectedSize) {
      size = item.selectedSize;
    }

    let iceLevel = '';
    if (item.iceLevel) {
      iceLevel = item.iceLevel;
    }

    let sweetness = '';
    if (item.sweetness) {
      sweetness = item.sweetness;
    }

    let toppings = [];
    if (Array.isArray(item.toppings)) {
      toppings = item.toppings.filter(Boolean);
    }

    let toppingDisplayNames = undefined;
    if (Array.isArray(item.toppingDisplayNames)) {
      toppingDisplayNames = item.toppingDisplayNames.filter(Boolean);
    }

    let totalPriceValue = 0;
    if (item.totalPrice) {
      totalPriceValue = item.totalPrice;
    } else if (item.unitPrice) {
      totalPriceValue = item.unitPrice;
    }

    return {
      drinkId: item.drinkId,
      drinkName,
      unitPrice: Number(unitPriceValue),
      quantity: Number(quantityValue),
      size,
      iceLevel,
      sweetness,
      toppings,
      toppingDisplayNames,
      totalPrice: Number(totalPriceValue),
    };
  });
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const { cart, clearCart, saveLastOrderInfo } = useCart();
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate totals (match ReviewPage exactly)
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.0826;
  const total = subtotal + tax;

  // Format card number with spaces (XXXX XXXX XXXX XXXX)
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry (MM/YY)
  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Format CVV (3-4 digits)
  const formatCVV = (value) => {
    return value.replace(/\D/g, '').slice(0, 4);
  };

  // Validate card details
  const validateCard = () => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanNumber.length < 15 || cleanNumber.length > 16) {
      return 'Invalid card number';
    }
    
    if (!expiry.match(/^\d{2}\/\d{2}$/)) {
      return 'Invalid expiry date';
    }
    
    const [month, year] = expiry.split('/').map(Number);
    if (month < 1 || month > 12) {
      return 'Invalid expiry month';
    }
    
    if (cvv.length < 3 || cvv.length > 4) {
      return 'Invalid CVV';
    }
    
    if (cardName.trim().length < 3) {
      return 'Invalid cardholder name';
    }
    
    return null;
  };

  // Process payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    const validationError = validateCard();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Helper to ensure 4-char DB-safe strings
      const to4 = (v) => {
        if (v == null) return '';
        const s = String(v);
        return s.slice(0, 4);
      };

      const orderData = {
        employeeID: 1, // Kiosk placeholder
        cartCards: cart.map((item) => ({
          drinkID: item.drinkId,
          quantity: Number(item.quantity ?? 1),
          totalPrice: Number((Number(item.totalPrice ?? item.unitPrice ?? 0)).toFixed(2)),
          iceLevel: to4(item.iceLevel),
          sweetness: to4(item.sweetness),
          toppings: Array.isArray(item.toppings) ? item.toppings.map(to4) : [],
        })),
        totalAmount: Number(total.toFixed(2)),
        paymentMethod: 'Card',
      };

      console.log('Processing payment with order:', JSON.stringify(orderData, null, 2));

      // Simulate payment processing delay (1.5 seconds for better UX)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await fetch('/api/cashier/process-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await res.json().catch(() => ({ 
        success: false, 
        error: 'Invalid response from server' 
      }));

      console.log('Payment response:', data);

      if (res.ok && data?.success) {
        const cartSnapshot = snapshotCartForStorage(cart);
        const summaryItems = summarizeCartForReceipt(cartSnapshot);

        saveLastOrderInfo({
          receiptId: data.receiptID,
          totalAmount: Number(total.toFixed(2)),
          cart: cartSnapshot,
          items: summaryItems,
        });

        clearCart();
        navigate('/kiosk/confirmation');
      } else {
        setError(data?.details || data?.error || data?.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Unable to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="kiosk-language-dropdown">
        <LanguageDropdown />
      </div>

      <div className="payment-container">
        <h2 className="payment-title">
          <TranslatedText text="Payment" />
        </h2>

        {/* Order Summary */}
        <div className="order-summary">
          <h3 className="summary-title">
            <TranslatedText text="Order Summary" />
          </h3>
          
          <div className="summary-row">
            <span><TranslatedText text="Subtotal" /></span>
            <span>{currency(subtotal).format()}</span>
          </div>
          
          <div className="summary-row">
            <span><TranslatedText text="Tax" /></span>
            <span>{currency(tax).format()}</span>
          </div>
          
          <div className="summary-row total-row">
            <span><TranslatedText text="Total" /></span>
            <span>{currency(total).format()}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label className="form-label">
              <TranslatedText text="Cardholder Name" />
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <TranslatedText text="Card Number" />
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              required
              className="form-input card-number-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <TranslatedText text="Expiry Date" />
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <TranslatedText text="CVV" />
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(formatCVV(e.target.value))}
                placeholder="123"
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="button-group">
            <button
              type="button"
              onClick={() => navigate('/kiosk/review')}
              disabled={loading}
              className="kiosk-nav-payment"
            >
              <TranslatedText text="Back to Review" />
            </button>

            <button
              type="submit"
              disabled={loading}
              className="kiosk-action-button pay-button"
            >
              {loading ? (
                <span className="loading-content">
                  <span className="spinner"></span>
                  <TranslatedText text="Processing..." />
                </span>
              ) : (
                <TranslatedText text="Pay Now" />
              )}
            </button>
          </div>
        </form>

        {/* Security Badge */}
        <div className="security-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span><TranslatedText text="Secure Payment" /></span>
        </div>
      </div>
    </div>
  );
}
