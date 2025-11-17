/*
 * DrinkCard.jsx
 * -----------------------
 * - Displays a single drink in the cashier order panel.
 * - Clicking the card selects the drink and passes it to the parent.
 */

import React from 'react';
import currency from 'currency.js';
import TranslateText from '../../common/TranslateText.jsx';
import '../css/order-panel.css';

const DrinkCard = ({ drink, onSelect }) => {
    const imageURL = `/${drink.imagePath || 'vite.svg'}`;      // fallback image
    const formattedPrice = currency(drink.price).format();      // price formatting

    const drinkSelection = () => {
        onSelect(drink);
    };

    return (
        <div className="drink-card" onClick={drinkSelection}>
            <img src={imageURL} alt={drink.name} className="drink-image" />
            <h3 className="drink-name">
                <TranslateText text={drink.name} />
            </h3>
            <p className="drink-price">{formattedPrice}</p>
        </div>
    );
};

export default DrinkCard;
