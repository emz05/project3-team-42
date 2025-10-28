import React, { useState, useEffect, useRef } from 'react';
import currency from 'currency.js';
import defaultImage from '../assets/react.svg';

const DrinkCard = ({drink, onSelect}) => {
    const imageURL = drink.imagePath || defaultImage;

    const formattedPrice = currency(drink.price).format();

    const drinkSelection = () => {
        onSelect(drink);
    };

    return(

        <div className="drink-card"> onClick = { drinkSelection() }
            <img src={imageURL} alt={drink.name} className="drink-image"/>
            <h3 className="drink-name"> {drink.name} </h3>
            <p className="drink-price"> {formattedPrice} </p>
        </div>
    );
};

export default DrinkCard;