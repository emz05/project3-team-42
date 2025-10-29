const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');
const Drink = require('../models/drink');
const Receipt = require('../models/receipt');
const Order = require('../models/order');
const Inventory = require('../models/inventory');
const pool = require('../database');


const drinkObj = (drink) => ({
    id: drink.id,
    name: drink.drink_name,
    price: parseFloat(drink.drink_price),
    imagePath: drink.drink_image_path,
    category: drink.category,
    isSeasonal: drink.is_seasonal
});

const validateRequest = (body) => {
    const { employeeID, cartCards, total, paymentMethod } = body;

    if (!employeeID || !cartCards || cartCards.length === 0 || !total || !paymentMethod) { return { valid: false, error: 'Missing parts to process order' } };

    return { valid: true };
};

router.get('/test', (req, res) => {
    res.send('Howdy testing');
});

// handles login requests from frontend, sends back employee data if password exists in DB
router.post('/login', async (req, res) => {
    try{
        const { password } = req.body;

        if (!password) return res.status(400).json({ error: 'Password required' });

        const employee = await Employee.getEmployeePassword(password);

        if (!employee) return res.status(400).json({ error: 'Invalid employee ID' });

        res.json({id: employee.id, firstName: employee.first_name, lastName: employee.last_name, role: employee.role });
    } catch (e){
        console.error('Post login: ', e);
        res.status(500).json({ error: 'Server error' });
    }
});

/*router.get('/order', (req, res) => {
    res.send('Order Page');
});*/

/*
router.post('/order', (req, res) => {
    const post = req.body

    post.title
})*/

router.get('/drinks', async (req, res) => {
    try{
        const drinks = await Drink.getDrinks();
        const drinkObjects = drinks.map(drinkObj);
        res.json(drinkObjects);
    } catch (e){
        console.error('Get drinks: ', e);
        res.status(500).json({ error: 'Failed to fetch drinks' });
    }
});

router.get('/drinks/:category', async(req, res) => {
    try{
        const { category } = req.params;
        const drinks = await Drink.getDrinksByCategory(category);
        const drinkObjects = drinks.map(drinkObj);
        res.json(drinkObjects);
    } catch (e){
        console.log('Get categorized drinks: ' + e);
        res.status(500).json({ error: 'Failed to fetch categorized drinks' });
    }
});

router.get('/next-order-num', async (req, res) => {
    try{
        const latestID = await Receipt.getlatestReceiptId();
        res.json({ orderNumber: latestID + 1});
    } catch (e){
        console.log('Get order number: ' + e);
        res.status(500).json({ error: 'Failed to fetch order num' });
    }
});

const processOrder = async (item, receiptID, connection) => {
    await Orders.addOrderItem(
        receiptID,
        item.drinkID,
        item.quantity,
        item.totalPrice,
        item.iceLevel,
        item.sweetness,
        item.toppings.join(', '),
        connection
    );

    await Inventory.updateDrinkIngredients(item.drinkID, item.quantity, connection);

    if(item.toppings && item.toppings.length > 0){
        for(const topping of item.toppings){
            await Inventory.updateTopping(topping, item.quantity, connection);
        }
    }

    await Inventory.updateLowStockStatus(item.drinkID, item.toppings, connection);
};




module.exports = router;

