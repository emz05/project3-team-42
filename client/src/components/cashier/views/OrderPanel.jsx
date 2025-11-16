import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import currency from 'currency.js';
import SlideTabs from "./Tabs";
import DrinkCard from "./DrinkCard.jsx";
import CartCard from "./CartCard.jsx";
import CustomizationPanel from "./CustomizationPanel.jsx";
import PaymentConfirmation from "./PaymentConfirmation.jsx";
import { useTranslation } from '../../../context/translation-storage.jsx';
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import {drinkAPI, orderAPI} from "../../../services/api.js";
import '../css/order-panel.css'

const OrderPanel = () => {
    const [employee, setEmployee] = useState(null);
    const [drinks, setDrinks] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState('Milk Tea');
    const [selectedDrink, setSelectedDrink] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [pointsInput, setPointsInput] = useState('');
    const [appliedPoints, setAppliedPoints] = useState(0);
    const [orderNumber, setOrderNumber] = useState(1);
    const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
    const [finalTotal, setFinalTotal] = useState(0);


    const navigate = useNavigate();
    const { translate } = useTranslation();

    const fetchDrinks = async () => {
        try{
            const drinkObjs = await drinkAPI.getDrinks();
            setDrinks(drinkObjs.data);
        } catch(e){
            console.error('Error fetching drinks: ', e);
        }
    };

    const fetchOrderNumber = async () => {
        try{
            const nextReceiptID = await orderAPI.getNextOrderNum();
            setOrderNumber(nextReceiptID.data.orderNumber);
        } catch(e){
            console.error('Error fetching order num: ', e);
        }
    }

    useEffect(() => {
        const loggedEmployee = sessionStorage.getItem('employee');
        if(loggedEmployee) { setEmployee(JSON.parse(loggedEmployee)) }

        fetchDrinks();

        fetchOrderNumber();

    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('employee');
        navigate('/home');
    };

    if (!employee) { return <p></p>; }

    const filteredDrinks = drinks.filter(d => d.category === activeCategory);

    // Add item to cart or increase quantity if already exists
    const handleAddToCart = (cartItem) => {
        // Check if item with same customizations already exists
        const existingIndex = cartItems.findIndex(item =>
            item.drinkId === cartItem.drinkId &&
            item.iceLevel === cartItem.iceLevel &&
            item.sweetness === cartItem.sweetness &&
            JSON.stringify(item.toppings) === JSON.stringify(cartItem.toppings)
        );

        const itemExists = existingIndex >= 0;

        if (itemExists) {
            // Increase quantity of existing item
            const updatedCart = [...cartItems];
            updatedCart[existingIndex].quantity += 1;
            updatedCart[existingIndex].totalPrice = updatedCart[existingIndex].unitPrice * updatedCart[existingIndex].quantity;
            setCartItems(updatedCart);
        } else {
            // Add new item to cart
            const updatedCart = [...cartItems, cartItem];
            setCartItems(updatedCart);
        }
    };

    // update cart item quantity or remove if quantity is 0
    const handleUpdateCart = (updatedItem) => {
        const shouldRemove = updatedItem.quantity === 0;

        if (shouldRemove) {
            const filteredCart = cartItems.filter(item =>
                !(
                    item.drinkId === updatedItem.drinkId &&
                    item.iceLevel === updatedItem.iceLevel &&
                    item.sweetness === updatedItem.sweetness &&
                    JSON.stringify(item.toppings) === JSON.stringify(updatedItem.toppings)
                )
            );
            setCartItems(filteredCart);
        } else {
            const updatedCart = cartItems.map(item => {
                const isSameItem =
                    item.drinkId === updatedItem.drinkId &&
                    item.iceLevel === updatedItem.iceLevel &&
                    item.sweetness === updatedItem.sweetness &&
                    JSON.stringify(item.toppings) === JSON.stringify(updatedItem.toppings);

                if (isSameItem) {
                    const newTotalPrice = updatedItem.unitPrice * updatedItem.quantity;
                    return { ...updatedItem, totalPrice: newTotalPrice };
                } else {
                    return item;
                }
            });
            setCartItems(updatedCart);
        }
    };


    // calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.0826;
    const pointsDiscount = appliedPoints;
    const total = Math.max(0, subtotal + tax - pointsDiscount);


    // apply points discount
    const applyPoints = async() => {
        const points = parseFloat(pointsInput);
        const isValidPoints = !isNaN(points) && points > 0;

        if (!isValidPoints) {
            alert(await translate('Please enter a valid points amount'));
            return;
        }
        const discountLimit = subtotal + tax;
        const appliedDiscount = Math.min(points, discountLimit);
        setAppliedPoints(appliedDiscount);
        const discount = currency(points).format();
        alert(await translate(`Applied ${discount} discount`));
    };

    // process payment and complete order
    const processTransaction = async () => {
        const cartIsEmpty = cartItems.length === 0;
        const noPaymentMethod = !paymentMethod;

        if (cartIsEmpty) {
            alert(await translate('Cart is empty'));
            return;
        }

        if (noPaymentMethod) {
            alert(await translate('Please select a payment method'));
            return;
        }

        try{
            const orderData = {
                employeeID: employee.id,
                cartCards: cartItems.map(obj => ({
                    drinkID: obj.drinkId,
                    quantity: obj.quantity,
                    totalPrice: obj.totalPrice,
                    iceLevel: obj.iceLevel,
                    sweetness: obj.sweetness,
                    toppings: obj.toppings
                })),
                totalAmount: total,
                paymentMethod: paymentMethod
            };

            const sendOrder = await orderAPI.processOrder(orderData);

            if(sendOrder.data.success){
                setFinalTotal(total);
                setShowPaymentConfirmation(true);
                setOrderNumber(orderNumber + 1);
                setCartItems([]);
                setPointsInput('');
                setAppliedPoints(0);
                setPaymentMethod('');
            }
        } catch(e){
            console.error('Error processing order: ', e);
        }
    };

    const formattedSubtotal = currency(subtotal).format();
    const formattedTax = currency(tax).format();
    const formattedTotal = currency(total).format();

    return (
        <div className="order-panel">
            <header className="order-header">
                <div className="order-language-dropdown"> <LanguageDropdown/></div>
                <h1 className="header-title"> <TranslatedText text={'Cashier View'} /></h1>
                <button className="logout-btn" onClick={handleLogout}>
                    <TranslatedText text={'Logout'} />
                </button>
            </header>

            <div className="order-content">
                <div className="menu-section">
                    <SlideTabs
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                    />

                    <div className="menu-grid">
                        {filteredDrinks.map(drink => (
                            <DrinkCard
                                key={drink.id}
                                drink={drink}
                                onSelect={setSelectedDrink}
                            />
                        ))}
                    </div>
                </div>

                <div className="cart-section">
                    <div className="cart-header">
                        <p className="employee-name"><TranslatedText text={`${employee.firstName} ${employee.lastName}`} /></p>
                        <p className="order-number">#{orderNumber}</p>
                    </div>

                    <div className="cart-items">
                        {cartItems.map((item, idx) => (
                            <CartCard
                                key={idx}
                                item={item}
                                onUpdate={handleUpdateCart}
                            />
                        ))}
                    </div>

                    <div className="cart-summary">
                        <div className="summary-row">
                            <span> <TranslatedText text={'SUBTOTAL'} /></span>
                            <span>{formattedSubtotal}</span>
                        </div>

                        <div className="summary-row">
                            <span> <TranslatedText text={'TAX'} /></span>
                            <span>{formattedTax}</span>
                        </div>

                        <div className="summary-row">
                            <span> <TranslatedText text={'POINTS'} /></span>
                            <input
                                type="number"
                                id="points"
                                className="points-input"
                                value={pointsInput}
                                onChange={(e) => setPointsInput(e.target.value)}
                                placeholder="0"
                            />
                            <button className="apply-points-btn" onClick={applyPoints}>
                                <TranslatedText text={'APPLY'} />
                            </button>
                        </div>

                        <div className="summary-row total-row">
                            <span> <TranslatedText text={'TOTAL'} /></span>
                            <span>{formattedTotal}</span>
                        </div>

                        <div className="payment-methods">
                            <button
                                className={`payment-btn ${paymentMethod === 'Card' && 'selected'}`}
                                onClick={() => setPaymentMethod('Card')}
                            >
                                <TranslatedText text={'Card'} />
                            </button>
                            <button
                                className={`payment-btn ${paymentMethod === 'Cash' && 'selected'}`}
                                onClick={() => setPaymentMethod('Cash')}
                            >
                                <TranslatedText text={'Cash'} />
                            </button>
                        </div>

                        <button
                            className="charge-btn"
                            onClick={processTransaction}
                            disabled={cartItems.length === 0 || !paymentMethod}
                        >
                            <TranslatedText text={'Charge Customer'} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedDrink && (
                <CustomizationPanel
                    drink={selectedDrink}
                    onClose={() => setSelectedDrink(null)}
                    onAdd={handleAddToCart}
                />
            )}

            {showPaymentConfirmation && (
                <PaymentConfirmation
                    orderNumber={orderNumber - 1}
                    total={finalTotal}
                    onClose={() => setShowPaymentConfirmation(false)}
                />
            )}
        </div>
    );
};

export default OrderPanel;