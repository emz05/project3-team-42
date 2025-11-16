const Stripe = require('stripe');
const pool = require('../database');
const Receipt = require('../models/receipt');
const { fulfillCartItem } = require('../orderFulfillment');
const PendingOrders = require('../models/pendingOrders');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const webhookHandler = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
        console.error('Webhook signature verification failed:', error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
        return;
    }

    console.log('Stripe webhook event:', event.type);

    if (event.type === 'payment_intent.succeeded') {
        try {
            const paymentIntent = event.data.object;
            console.log('PaymentIntent metadata:', paymentIntent.metadata, 'payment_link:', paymentIntent.payment_link);
            await finalizePendingOrder(paymentIntent);
        } catch (error) {
            console.error('Failed to finalize pending order:', error);
        }
    }

    res.json({ received: true });
};

async function finalizePendingOrder(paymentIntent) {
    const metadata = paymentIntent.metadata || {};
    const pendingOrderId = metadata.pendingOrderId;
    const paymentLinkId = paymentIntent.payment_link;

    let pendingOrder = null;

    if (pendingOrderId) {
        pendingOrder = await PendingOrders.findById(pendingOrderId);
    }

    if (!pendingOrder && paymentLinkId) {
        pendingOrder = await PendingOrders.findByPaymentLinkId(paymentLinkId);
    }

    if (!pendingOrder) {
        console.warn('Pending order not found for payment intent', paymentIntent.id, 'link', paymentLinkId);
        return;
    }

    if (pendingOrder.status !== 'pending') {
        return;
    }

    let cartItems = pendingOrder.cart;
    if (!Array.isArray(cartItems)) {
        try {
            cartItems = JSON.parse(cartItems);
        } catch (error) {
            console.error('Unable to parse cart JSON for pending order', pendingOrder.id);
            throw error;
        }
    }
    const connection = await pool.connect();

    try {
        await connection.query('BEGIN');

        const receiptId = await Receipt.createReceipt(
            pendingOrder.employee_id,
            pendingOrder.total_amount,
            'Card',
            connection
        );

        for (const item of cartItems) {
            await fulfillCartItem(item, receiptId, connection);
        }

        await PendingOrders.markCompleted(connection, pendingOrder.id, paymentIntent.id, receiptId);

        await connection.query('COMMIT');
    } catch (error) {
        await connection.query('ROLLBACK');
        console.error('finalize pending order error:', error);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { webhookHandler };
