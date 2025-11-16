const express = require('express');
const Stripe = require('stripe');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// client calls when card payment from cashier side
router.post('/session', async (req, res) => {
    const { orderId, amount, currency = 'usd' } = req.body;

    if (!orderId || !amount) {
        return res.status(400).json({ error: 'orderId and amount are required' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            // amount expected in cents
            amount: Math.round(amount * 100),
            currency,
            metadata: { orderId },
        });

        res.json({
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('create session error:', error);
        res.status(500).json({ error: 'Unable to start card payment' });
    }
});

module.exports = router;