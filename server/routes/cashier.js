const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');
const Drink = require('../models/drinks');
const Receipt = require('../models/receipt');
const pool = require('../database');
const { fulfillCartItem } = require('../models/orderFulfillment');


const drinkObj = (drink) => ({
    id: drink.id,
    name: drink.drink_name,
    price: parseFloat(drink.drink_price),
    imagePath: drink.drink_image_path,
    category: drink.category,
    isSeasonal: drink.is_seasonal
});

const validateRequest = (body) => {
    const { employeeID, cartCards, totalAmount, paymentMethod } = body;

    if (!employeeID || !cartCards || cartCards.length === 0 || !totalAmount || !paymentMethod) { return { valid: false, error: 'Missing parts to process order' } };

    return { valid: true };
};

router.get('/', (req, res) => {
    res.json({ message: 'working Cashier API' });
});


router.post('/login', async (req, res) => {
    try{
        const { password } = req.body;

        if (!password) return res.status(400).json({ error: 'Password required' });

        const employee = await Employee.getEmployeePassword(password);

        if (!employee) return res.status(400).json({ error: 'Invalid employee ID' });

        res.json({id: employee.id, firstName: employee.first_name, lastName: employee.last_name, role: employee.role });
    } catch (e){
        console.error('Post login: ', e);
        res.status(500).json({ error: e.message });
    }
});

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

// http://localhost:8080/api/cashier/drinks/milk%20tea for milk tea category bc of space
router.get('/drinks/:category', async(req, res) => {
    try{
        const { category } = req.params;
        const isSeasonal = category && category.toLowerCase() === 'seasonal';

        const drinks = isSeasonal
            ? (await pool.query(
                'SELECT id, drink_name, drink_price, drink_image_path, category, is_seasonal FROM Drink WHERE is_seasonal = true ORDER BY id'
              )).rows
            : await Drink.getDrinksByCategory(category);

        const drinkObjects = drinks.map(drinkObj);
        res.json(drinkObjects);
    } catch (e){
        console.log('Get categorized drinks: ', e);
        res.status(500).json({ error: 'Failed to fetch categorized drinks' });
    }
});

router.get('/next-order-num', async (req, res) => {
    try{
        const latestID = await Receipt.getlatestReceiptId();
        res.json({ orderNumber: latestID + 1});
    } catch (e){
        console.log('Get order number: ', e);
        res.status(500).json({ error: 'Failed to fetch order num' });
    }
});

router.post('/process-order', async (req, res) => {
    const connection = await pool.connect();

    // remove auto commit to allow undo if error occurs
    try{
        await connection.query('BEGIN');

        const validate = validateRequest(req.body);
        if(!validate.valid){
            await connection.query('ROLLBACK');
            return res.status(400).json({ error: validate.error });
        }

        const { employeeID, cartCards, totalAmount, paymentMethod } = req.body;

        // updates Receipt table
        const receiptID = await Receipt.createReceipt(employeeID, totalAmount, paymentMethod, connection);

        // updates Orders table
        for(const card of cartCards){
            await fulfillCartItem(card, receiptID, connection);
        }

        await connection.query('COMMIT');

        res.json({ success: true, receiptID: receiptID, message: 'Order processed successfully' });
    } catch (e){
        await connection.query('ROLLBACK');
        console.error('Post process order: ', e);
        res.status(500).json({ error: 'Failed to process order', details: e.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
