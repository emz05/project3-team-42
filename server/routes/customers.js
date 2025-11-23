const express = require('express');
const router = express.Router();
const pool = require('../database');
const Receipt = require('../models/receipt');
const Customers = require('../models/customers');

router.post('/orders', async (req, res) => {
    const { phoneNumber, receiptId, totalAmount, cart } = req.body || {};
    if (!phoneNumber || !receiptId) {
        return res.status(400).json({ error: 'MISSING_FIELDS' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await Receipt.updateCustomerPhone(receiptId, phoneNumber, client);
        await Customers.recordOrder({ phoneNumber, receiptId, totalAmount, cart }, client);
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('CUSTOMER_ORDER_RECORD_FAILED', error);
        res.status(500).json({ error: 'CUSTOMER_ORDER_RECORD_FAILED' });
    } finally {
        client.release();
    }
});

router.get('/:phone/orders', async (req, res) => {
    try {
        const orders = await Customers.getRecentOrders(req.params.phone, Number(req.query.limit) || 5);
        res.json({ orders });
    } catch (error) {
        console.error('CUSTOMER_ORDER_HISTORY_FAILED', error);
        res.status(500).json({ error: 'CUSTOMER_ORDER_HISTORY_FAILED' });
    }
});

module.exports = router;
