const express = require('express');
const Stripe = require('stripe');
const pool = require('../database');
const { insertPendingOrder, updatePaymentLink, findById } = require('../models/pendingOrders');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/', async (req, res) => {
    const { orderId, employeeId, cartCards, totalAmount, currency = 'usd' } = req.body || {};

    if (!orderId || !employeeId || !Array.isArray(cartCards) || cartCards.length === 0 || !totalAmount) {
        return res.status(400).json({ error: 'Missing required fields for pending order' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const normalizedCart = cartCards.map((item) => ({
            drinkID: item.drinkId,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            iceLevel: item.iceLevel,
            sweetness: item.sweetness,
            toppings: Array.isArray(item.toppings) ? item.toppings : [],
        }));

        const pending = await insertPendingOrder(client, {
            orderId,
            employeeId,
            cart: normalizedCart,
            totalAmount,
        });

        const paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price_data: {
                        currency,
                        unit_amount: Math.round(totalAmount * 100),
                        product_data: { name: `Order #${orderId}` },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                pendingOrderId: pending.id,
                orderId,
            },
            payment_intent_data: {
                metadata: {
                    pendingOrderId: pending.id,
                    orderId,
                },
            },
            after_completion: {
                type: 'hosted_confirmation',
                hosted_confirmation: {
                    custom_message: 'Thanks! You may close this tab.',
                },
            },
        });

        await updatePaymentLink(client, pending.id, paymentLink.id);
        await client.query('COMMIT');

        res.json({
            pendingOrderId: pending.id,
            url: paymentLink.url,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('create pending order error:', error);
        res.status(500).json({ error: 'Unable to start card payment' });
    } finally {
        client.release();
    }
});

router.get('/:id', async (req, res) => {
    try {
        const pending = await findById(req.params.id);
        if (!pending) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json({
            status: pending.status,
            receiptId: pending.receipt_id,
        });
    } catch (error) {
        console.error('pending order status error:', error);
        res.status(500).json({ error: 'Unable to fetch pending order status' });
    }
});

module.exports = router;
