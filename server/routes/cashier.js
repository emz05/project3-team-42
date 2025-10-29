const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');

const drinkObj = (drink) => ({
    id: drink.id,
    name: drink.drink_name,
    price: parseFloat(drink.drink_price),
    imagePath: drink.drink_image_path,
    category: drink.category,
    isSeasonal: drink.is_seasonal
});

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

module.exports = router;

