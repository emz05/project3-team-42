/*
order status for processing payment transactions
 */
const Stripe = require('stripe');
const pool = require('./database');
const { insertPendingOrder, updatePaymentLink } = require('./models/pendingOrders');

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? Stripe(stripeSecret) : null;

function normalizeCart(cartCards = []) {
    return cartCards.map((item) => {
        const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : Number(item.totalPrice || 0);
        const quantity = item.quantity || 1;

        return {
            drinkID: item.drinkId || item.drinkID,
            quantity,
            totalPrice: unitPrice * quantity,
            iceLevel: item.iceLevel || item.ice,
            sweetness: item.sweetness || item.sugar,
            toppings: Array.isArray(item.toppings) ? item.toppings : [],
        };
    });
}

async function startCardPayment({
    orderId,
    employeeId,
    cartCards,
    totalAmount,
    currency = 'usd',
    metadata = {},
}) {
    if (!stripe) {
        throw new Error('STRIPE_NOT_CONFIGURED');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const normalizedCart = normalizeCart(cartCards);
        const pending = await insertPendingOrder(client, {
            orderId,
            employeeId,
            cart: normalizedCart,
            totalAmount,
        });

        const mergedMeta = {
            pendingOrderId: pending.id,
            orderId,
            ...metadata,
        };

        const paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price_data: {
                        currency,
                        unit_amount: Math.round(Number(totalAmount || 0) * 100),
                        product_data: {
                            name: `Order #${orderId}`,
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: mergedMeta,
            payment_intent_data: {
                metadata: mergedMeta,
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

        return { pendingOrderId: pending.id, url: paymentLink.url };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    startCardPayment,
};
