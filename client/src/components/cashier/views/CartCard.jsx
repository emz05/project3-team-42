import React from 'react';
import currency from 'currency.js';
import '../css/order-panel.css';

const CartCard = ({ item, onUpdate }) => {
    const imageURL = `/${item.imagePath || 'vite.svg'}`;

    const formattedPrice = currency(item.totalPrice).format();

    const handleIncrease = () => {
        const updatedItem = {
            ...item, // manually copy all obj properties
            quantity: item.quantity + 1
        };
        onUpdate(updatedItem);
    };

    const handleDecrease = () => {
        let newQuantity;

        if (item.quantity > 1) { newQuantity = item.quantity - 1; }
        else { newQuantity = 0; }

        const updatedItem = {
            ...item,
            quantity: newQuantity
        };

        onUpdate(updatedItem);
    };

    const buildCustomizationText = () => {
        const customizations = [];

        if (item.iceLevel && item.iceLevel !== 'Regular Ice') {
            customizations.push(item.iceLevel);
        }

        if (item.sweetness && item.sweetness !== '100%') {
            customizations.push(item.sweetness);
        }

        if (item.toppings && item.toppings.length > 0) {
            customizations.push(item.toppings.join(', '));
        }

        return customizations.join(' • ');
    };

    const customizationText = buildCustomizationText();

    return (
        <div className="cart-card">
            <img
                src={imageURL}
                alt={item.drinkName}
                className="cart-card-image"
            />

            <div className="cart-card-details">
                <h4 className="cart-card-name">{item.drinkName}</h4>

                {customizationText && (
                    <p className="cart-card-customizations">
                        {customizationText}
                    </p>
                )}

                <p className="cart-card-price">{formattedPrice}</p>
            </div>

            <div className="cart-card-quantity">
                <button
                    className="quantity-btn decrease-btn"
                    onClick={handleDecrease}
                >
                    -
                </button>

                <span className="quantity-label">{item.quantity}</span>

                <button
                    className="quantity-btn increase-btn"
                    onClick={handleIncrease}
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default CartCard;