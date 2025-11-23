import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import currency from 'currency.js';
import QRCode from 'react-qr-code';
import SlideTabs from "./Tabs";
import DrinkCard from "./DrinkCard.jsx";
import CartCard from "./CartCard.jsx";
import CustomizationPanel from "./CustomizationPanel.jsx";
import PaymentConfirmation from "./PaymentConfirmation.jsx";
import { useTranslation } from '../../../context/translation-storage.jsx';
import LanguageDropdown from "../../common/LanguageDropdown.jsx";
import TranslatedText from "../../common/TranslateText.jsx";
import { drinkAPI, orderAPI, pendingOrderAPI, notificationAPI, customerAPI } from "../../../services/api.js";
import '../css/order-panel.css'

// Remove all non-digit characters from phone input
function normalizePhoneInput(value) {
    if (!value) {
        return '';
    }
    return value.replace(/\D/g, '');
}

function cloneCartForStorage(items) {
    if (!items) {
        return [];
    }

    return items.map((item) => ({
        drinkId: item.drinkId,
        drinkName: item.drinkName || item.name || `Drink #${item.drinkId}`,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        size: item.size || item.selectedSize || '',
        iceLevel: item.iceLevel || '',
        sweetness: item.sweetness || '',
        toppings: Array.isArray(item.toppings) ? item.toppings.filter(Boolean) : [],
        totalPrice: item.totalPrice,
    }));
}

function summarizeCartForSms(items) {
    if (!items) {
        items = [];
    }

    return items.map((item) => ({
        drinkName: item.drinkName || `Drink #${item.drinkId}`,
        size: item.size || '',
        sugar: item.sweetness || '',
        ice: item.iceLevel || '',
        toppings: Array.isArray(item.toppings) ? item.toppings.filter(Boolean) : [],
    }));
}

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
    const [paymentSession, setPaymentSession] = useState(null);
    const [cashReceived, setCashReceived] = useState('');
    const [changeDue, setChangeDue] = useState(null);
    const [showCashPanel, setShowCashPanel] = useState(false);
    const [pendingOrderId, setPendingOrderId] = useState(null);
    const [pendingTotal, setPendingTotal] = useState(0);
    const [confirmationReceiptId, setConfirmationReceiptId] = useState(null);
    const [pendingCartSnapshot, setPendingCartSnapshot] = useState([]);
    const [lastCartSnapshot, setLastCartSnapshot] = useState([]);
    const [lastOrderNumber, setLastOrderNumber] = useState(null);
    const [lastReceiptId, setLastReceiptId] = useState(null);



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

    useEffect(() => {
        if (!pendingOrderId) {
            return undefined;
        }

        let cancelled = false;
        let timeoutId;

        const checkStatus = async () => {
            try {
                const { data } = await pendingOrderAPI.status(pendingOrderId);
                if (cancelled) {
                    return;
                }

                if (data.status === 'paid') {
                    await handlePendingOrderPaid(data.receiptId);
                    return;
                }

                timeoutId = setTimeout(checkStatus, 4000);
            } catch (error) {
                console.error('pending order status', error);
                timeoutId = setTimeout(checkStatus, 4000);
            }
        };

        checkStatus();

        return () => {
            cancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [pendingOrderId]);

    const handleLogout = () => {
        sessionStorage.removeItem('employee');
        navigate('/home');
    };

    const handleCloseConfirmation = () => {
        setShowPaymentConfirmation(false);
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

    const handlePendingOrderPaid = async (receiptId) => {
        const paidTotal = pendingTotal || total;
        let cartForStorage = cloneCartForStorage(cartItems);
        if (pendingCartSnapshot.length > 0) {
            cartForStorage = pendingCartSnapshot;
        }
        const smsItems = summarizeCartForSms(cartForStorage);
        const orderId = orderNumber;
        setPaymentSession(null);
        setPendingOrderId(null);
        setPaymentMethod('');
        setPendingTotal(0);
        setConfirmationReceiptId(receiptId || null);
        setFinalTotal(paidTotal);
        setShowPaymentConfirmation(true);
        setOrderNumber(orderNumber + 1);
        setLastOrderNumber(orderId);
        setLastReceiptId(receiptId || null);
        setLastCartSnapshot(cartForStorage);
        setCartItems([]);
        setPointsInput('');
        setAppliedPoints(0);
        setCashReceived('');
        setChangeDue(null);
        setPendingCartSnapshot([]);
        fetchOrderNumber();
    };

    // completes order depending on selected method type
    const handleSelectPayment = async (method) => {
        setPaymentMethod(method);

        if (method === 'Card') {
            try {
                if (!employee) {
                    alert(await translate('Employee not found. Please log in again.'));
                    return;
                }
                const { data } = await pendingOrderAPI.create({
                    orderId: orderNumber,
                    employeeId: employee.id,
                    cartCards: cartItems,
                    totalAmount: total,
                });
                const storedCart = cloneCartForStorage(cartItems);
                setPendingCartSnapshot(storedCart);
                setPendingTotal(total);
                setPendingOrderId(data.pendingOrderId);
                setPaymentSession({
                    url: data.url,
                });
            } catch (error) {
                console.error(error);
                alert(await translate('Unable to start card payment.'));
                setPaymentMethod('');
            }
        } else if (method === 'Cash') {
            setPaymentSession(null);
            setPendingOrderId(null);
            setPendingTotal(0);
            setPendingCartSnapshot(cloneCartForStorage(cartItems));
            setShowCashPanel(true);
        }
    };

    // upon cash, validate input, compute change, close panel
    const handleCashConfirm = async () => {
        const received = parseFloat(cashReceived);
        if (Number.isNaN(received)) {
            alert(await translate('Enter the amount received.'));
            return;
        }
        if (received < total) {
            alert(await translate('Cash received must cover the total.'));
            return;
        }

        setChangeDue(received - total);
    };

    // upon charge button, validate cash payment | await processing transaction until card charged
    const handleCharge = async () => {
        if (paymentMethod === 'Cash') {
            const received = parseFloat(cashReceived);
            if (Number.isNaN(received)) {
                alert(await translate('Enter the amount received.'));
                return;
            }
            if (received < total) {
                alert(await translate('Cash received must cover the total.'));
                return;
            }

            const change = received - total;
            setChangeDue(change);
            await processTransaction();
            return;
        }

        if (paymentMethod === 'Card') {
            alert(await translate('Complete the card payment before charging.'));
            return;
        }

        await processTransaction();
    };

    // process payment and complete order
    const processTransaction = async (methodOverride) => {
        const methodToUse = methodOverride || paymentMethod;

        if (methodToUse === 'Card') {
            console.warn('processTransaction skipped for card payments; webhook handles receipt creation.');
            return;
        }
        const cartIsEmpty = cartItems.length === 0;
        const noPaymentMethod = !methodToUse;

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
                paymentMethod: methodToUse,
            };

            const sendOrder = await orderAPI.processOrder(orderData);

            if(sendOrder.data.success){
                const storedCart = cloneCartForStorage(cartItems);
                const smsItems = summarizeCartForSms(storedCart);
                const currentOrderId = orderNumber;
                const receiptId = sendOrder.data.receiptID || null;
                setFinalTotal(total);
                setShowPaymentConfirmation(true);
                setConfirmationReceiptId(receiptId);
                setOrderNumber(orderNumber + 1);
                setLastOrderNumber(currentOrderId);
                setLastReceiptId(receiptId);
                setLastCartSnapshot(storedCart);
                setCartItems([]);
                setPointsInput('');
                setAppliedPoints(0);
                setPaymentMethod('');
                setPendingOrderId(null);
                setPendingTotal(0);
                setPendingCartSnapshot([]);
                setCashReceived('');
                setChangeDue(null);
            }
        } catch(e){
            console.error('Error processing order: ', e);
        }
    };

    const formattedSubtotal = currency(subtotal).format();
    const formattedTax = currency(tax).format();
    const formattedTotal = currency(total).format();

    const handleSendReceiptSms = async (digits) => {
        const phoneDigits = normalizePhoneInput(digits);
        if (phoneDigits.length !== 10) {
            throw new Error('INVALID_PHONE');
        }

        const snapshot = lastCartSnapshot.length > 0
            ? lastCartSnapshot
            : cloneCartForStorage(cartItems);

        const receiptId = confirmationReceiptId || lastReceiptId;

        if (!lastOrderNumber || snapshot.length === 0 || !receiptId) {
            throw new Error('NO_ORDER_READY');
        }

        await customerAPI.recordOrder({
            phoneNumber: phoneDigits,
            receiptId,
            totalAmount: finalTotal,
            cart: snapshot,
        });

        await notificationAPI.sendOrderConfirmation({
            phoneNumber: phoneDigits,
            orderNumber: lastOrderNumber,
            items: summarizeCartForSms(snapshot)
        });
    };

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
                                placeholder="0.00"
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
                                onClick={() => handleSelectPayment('Card')}
                            >
                                <TranslatedText text={'Card'} />
                            </button>
                            <button
                                className={`payment-btn ${paymentMethod === 'Cash' && 'selected'}`}
                                onClick={() => handleSelectPayment('Cash')}
                            >
                                <TranslatedText text={'Cash'} />
                            </button>
                        </div>

                        <button
                            className="charge-btn"
                            onClick={handleCharge}
                            disabled={cartItems.length === 0 || !paymentMethod || paymentMethod === 'Card'}
                        >
                            <TranslatedText text={'Charge Customer'} />
                        </button>
                    </div>
                </div>
            </div>

            {paymentMethod === 'Cash' && showCashPanel && (
                <div className="qr-overlay" onClick={() => setShowCashPanel(false)}>
                    <div className="qr-card" onClick={(e) => e.stopPropagation()}>
                        <button className="qr-close" onClick={() => setShowCashPanel(false)}>×</button>
                        <h3><TranslatedText text="Enter cash received" /></h3>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={cashReceived}
                            onChange={(event) => setCashReceived(event.target.value)}
                            placeholder="0.00"
                        />
                        {changeDue !== null && (
                            <p><TranslatedText text="Change due" />: {currency(changeDue).format()}</p>
                        )}
                        <button onClick={handleCashConfirm}><TranslatedText text="Confirm" /></button>
                    </div>
                </div>
            )}


            {paymentMethod === 'Card' && paymentSession && (
                <div className="qr-overlay" onClick={() => { setPaymentSession(null); }}>
                    <div className="qr-card" onClick={(e) => e.stopPropagation()}>
                        <h3><TranslatedText text="Scan to pay" /></h3>
                        <div className="qr-code-wrapper">
                            <QRCode value={paymentSession.url} size={220} /></div>
                            <p><TranslatedText text="Please Scan and Make Payment on Device" /></p>
                        <button onClick={() => { setPaymentSession(null); }}>
                            <TranslatedText text="Cancel" />
                        </button>
                    </div>
                </div>
            )}

            {selectedDrink && (
                <CustomizationPanel
                    drink={selectedDrink}
                    onClose={() => setSelectedDrink(null)}
                    onAdd={handleAddToCart}
                />
            )}

            {showPaymentConfirmation && (
                <PaymentConfirmation
                    orderNumber={lastOrderNumber}
                    total={finalTotal}
                    onSendSms={handleSendReceiptSms}
                    onClose={handleCloseConfirmation}
                />
            )}
        </div>
    );
};

export default OrderPanel;
