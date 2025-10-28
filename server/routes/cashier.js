const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');

router.get('/test', (req, res) => {
    res.json({ ok: true });
});

// handles login requests from frontend, sends back employee data if password exists in DB
router.post('/login', async (req, res) => {
    try{
        const { password } = req.body;

        if (!password) return res.status(400).json({ error: 'Password required' });

        const employee = await Employee.getEmployeePassword(password);

        if (!employee) return res.status(400).json({ error: 'Invalid employee ID' });

        res.json({id: employee.id, firstName: employee.first_name, lastName: employee.last_name, role: employee.role });
    } catch (err){
        console.error(err);
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


module.exports = router;

