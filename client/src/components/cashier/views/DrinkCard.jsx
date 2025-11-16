import React from 'react';
import currency from 'currency.js';
import TranslateText from '../../common/TranslateText.jsx';
import '../css/order-panel.css';

const DrinkCard = ({drink, onSelect}) => {
    const imageURL = `/${drink.imagePath || 'vite.svg'}`;
    const formattedPrice = currency(drink.price).format();

    const drinkSelection = () => {
        onSelect(drink);
    };

    return(

        <div className="drink-card" onClick = { drinkSelection }>
            <img src={ imageURL } alt={ drink.name } className="drink-image"/>
            <h3 className="drink-name"> <TranslateText text={ drink.name } /></h3>
            <p className="drink-price"> { formattedPrice } </p>
        </div>
    );
};

export default DrinkCard;