import React, { useState, useEffect, useRef } from 'react';
import '../css/order-panel.css';

const CustomizationPanel = ({ drink, onClose, onAdd }) => {
    // default drink state
    const [iceLevel, setIceLevel] = useState('Regular Ice');
    const [sweetness, setSweetness] = useState('100%');
    const [toppings, setToppings] = useState([]);

    const iceOptions = ['Regular Ice', 'Light Ice', 'No Ice', 'Extra Ice'];
    const sweetnessOptions = ['100%', '80%', '50%', '30%', '0%', '120%'];
    const toppingOptions = ['Boba', 'Jelly', 'Ice Cream', 'Condensed Milk'];

    // Add or remove a topping
    const toggleTopping = (topping) => {
        const isAlreadySelected = toppings.includes(topping);

        if (isAlreadySelected) {
            const updatedToppings = toppings.filter(t => t !== topping);
            setToppings(updatedToppings);
        } else {
            const updatedToppings = [...toppings, topping];
            setToppings(updatedToppings);
        }
    };

    // Build the cart item and add it
    const handleAdd = () => {
        const cartItem = {
            drinkId: drink.id,
            drinkName: drink.name,
            imagePath: drink.imagePath,
            unitPrice: drink.price,
            quantity: 1,
            iceLevel: iceLevel,
            sweetness: sweetness,
            toppings: toppings,
            totalPrice: drink.price
        };

        onAdd(cartItem);
        onClose();
    };

    // close customizations panel on background selection
    const closePanel = () => {
        onClose();
    };

    // prevent multiple firings of customization panel
    const handlePanelDuplicates = (event) => {
        event.stopPropagation();
    };

    // communicates with UI which buttons are selected
    // enabling direct feedback from on action events
    const isIceSelected = (option) => {
        return iceLevel === option;
    };

    const isSweetnessSelected = (option) => {
        return sweetness === option;
    };

    const isToppingSelected = (option) => {
        return toppings.includes(option);
    };

    return (
        <div className="panel-overlay" onClick={closePanel}>
            <div className="panel-content" onClick={handlePanelDuplicates}>

                {/* Header with Cancel and Add buttons */}
                <div className="panel-header">
                    <button className="panel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <h2 className="panel-title">{drink.name}</h2>
                    <button className="panel-btn panel-btn-primary" onClick={handleAdd}>
                        Add
                    </button>
                </div>

                {/* Customization options */}
                <div className="panel-body">

                    {/* Ice Level Section */}
                    <section className="customization-section">
                        <h3 className="section-title">Ice Level</h3>
                        <div className="option-grid">
                            {iceOptions.map(option => {
                                const isSelected = isIceSelected(option);

                                let buttonClass = 'option-btn';
                                if (isSelected) {
                                    buttonClass = 'option-btn selected';
                                }

                                return (
                                    <button key={option} className={buttonClass} onClick={() => setIceLevel(option)}>
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Sweetness Level Section */}
                    <section className="customization-section">
                        <h3 className="section-title">Sweetness Level</h3>
                        <div className="option-grid">
                            {sweetnessOptions.map(option => {
                                const isSelected = isSweetnessSelected(option);

                                let buttonClass = 'option-btn';
                                if (isSelected) {
                                    buttonClass = 'option-btn selected';
                                }

                                return (
                                    <button key={option} className={buttonClass} onClick={() => setSweetness(option)}>
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Toppings Section */}
                    <section className="customization-section">
                        <h3 className="section-title">Toppings</h3>
                        <div className="option-grid">
                            {toppingOptions.map(option => {
                                const isSelected = isToppingSelected(option);

                                let buttonClass = 'option-btn';
                                if (isSelected) {
                                    buttonClass = 'option-btn selected';
                                }

                                return (
                                    <button key={option} className={buttonClass} onClick={() => toggleTopping(option)}>
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default CustomizationPanel;