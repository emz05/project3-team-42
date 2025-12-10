import React, { useState, useEffect, useRef } from 'react';
import TranslatedText from "../../common/TranslateText.jsx";
import '../css/order-panel.css';

const CustomizationPanel = ({ drink, onClose, onAdd }) => {
    // default drink state
    const [iceLevel, setIceLevel] = useState('Regular Ice');
    const [sweetness, setSweetness] = useState('100%');
    const [toppings, setToppings] = useState([]);
    const [size, setSize] = useState('Medium');
    const [temperature, setTemperature] = useState('Iced');

    const sizeOptions = ['Small', 'Medium', 'Large'];
    const iceOptions = ['Regular Ice', 'Light Ice', 'No Ice', 'Extra Ice'];
    const sweetnessOptions = ['100%', '80%', '50%', '30%', '0%', '120%'];
    const toppingOptions = ['Boba', 'Jelly', 'Ice Cream', 'Condensed Milk'];
    const temperatureOptions = ['Iced', 'Hot'];

    const sizeUpcharge = {
        Small: 0,
        Medium: 0.5,
        Large: 1,
    };

    // If Hot is selected for Milk Tea, clear ice level and hide options
    useEffect(() => {
        if (drink.category === 'Milk Tea' && temperature === 'Hot') {
            setIceLevel('');
        } else if (!iceLevel) {
            setIceLevel('Regular Ice');
        }
    }, [drink.category, temperature, iceLevel]);

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
        const basePrice = Number(drink.price) || 0;
        const unitPrice = basePrice + (sizeUpcharge[size] || 0);

        const cartItem = {
            drinkId: drink.id,
            drinkName: drink.name,
            imagePath: drink.imagePath,
            unitPrice,
            quantity: 1,
            size,
            temperature: drink.category === 'Milk Tea' ? temperature : undefined,
            iceLevel: iceLevel,
            sweetness: sweetness,
            toppings: toppings,
            totalPrice: unitPrice
        };

        onAdd(cartItem);
        onClose();

        setSize('Medium');
        setTemperature('Iced');
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
                        <TranslatedText text={'Cancel'}/>
                    </button>
                    <h2 className="panel-title"><TranslatedText text={drink.name}/></h2>
                    <button className="panel-btn panel-btn-primary" onClick={handleAdd}>
                        <TranslatedText text={'Add'}/>
                    </button>
                </div>

                {/* Customization options */}
                <div className="panel-body">

                    {/* Size Section */}
                    <section className="customization-section">
                        <h3 className="section-title"><TranslatedText text={'Size'}/></h3>
                        <div className="option-grid">
                            {sizeOptions.map(option => {
                                const isSelected = size === option;

                                let buttonClass = 'option-btn';
                                if (isSelected) {
                                    buttonClass = 'option-btn selected';
                                }

                                return (
                                    <button key={option} className={buttonClass} onClick={() => setSize(option)}>
                                        <TranslatedText text={option}/>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {drink.category === 'Milk Tea' && (
                        <section className="customization-section">
                            <h3 className="section-title"><TranslatedText text={'Temperature'}/></h3>
                            <div className="option-grid">
                                {temperatureOptions.map(option => {
                                    const isSelected = temperature === option;

                                    let buttonClass = 'option-btn';
                                    if (isSelected) {
                                        buttonClass = 'option-btn selected';
                                    }

                                    return (
                                        <button key={option} className={buttonClass} onClick={() => setTemperature(option)}>
                                            <TranslatedText text={option}/>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Ice Level Section (skip for hot Milk Tea) */}
                    {!(drink.category === 'Milk Tea' && temperature === 'Hot') && (
                        <section className="customization-section">
                            <h3 className="section-title"><TranslatedText text={'Ice Level'}/></h3>
                            <div className="option-grid">
                                {iceOptions.map(option => {
                                    const isSelected = isIceSelected(option);

                                    let buttonClass = 'option-btn';
                                    if (isSelected) {
                                        buttonClass = 'option-btn selected';
                                    }

                                    return (
                                        <button key={option} className={buttonClass} onClick={() => setIceLevel(option)}>
                                            <TranslatedText text={option}/>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Sweetness Level Section */}
                    <section className="customization-section">
                        <h3 className="section-title"><TranslatedText text={'Sweetness Level'}/></h3>
                        <div className="option-grid">
                            {sweetnessOptions.map(option => {
                                const isSelected = isSweetnessSelected(option);

                                let buttonClass = 'option-btn';
                                if (isSelected) {
                                    buttonClass = 'option-btn selected';
                                }

                                return (
                                    <button key={option} className={buttonClass} onClick={() => setSweetness(option)}>
                                        <TranslatedText text={option}/>
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
                                        <TranslatedText text={option}/>
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
