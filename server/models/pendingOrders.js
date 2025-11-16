const pool = require('../database');

async function insertPendingOrder(client, { orderId, employeeId, cart, totalAmount }) {
    const cartJson = JSON.stringify(cart);
    const { rows } = await client.query(
        `INSERT INTO pending_orders (order_id, employee_id, cart, total_amount, payment_link_id)
         VALUES ($1, $2, $3::jsonb, $4, $5)
         RETURNING id`,
        [orderId, employeeId, cartJson, totalAmount, '__pending__']
    );
    return rows[0];
}

async function updatePaymentLink(client, pendingId, paymentLinkId) {
    await client.query(
        `UPDATE pending_orders
         SET payment_link_id = $1
         WHERE id = $2`,
        [paymentLinkId, pendingId]
    );
}

async function findById(id) {
    const { rows } = await pool.query(
        `SELECT *
         FROM pending_orders
         WHERE id = $1`,
        [id]
    );
    return rows[0];
}

async function findByPaymentLinkId(paymentLinkId) {
    const { rows } = await pool.query(
        `SELECT *
         FROM pending_orders
         WHERE payment_link_id = $1`,
        [paymentLinkId]
    );
    return rows[0];
}

async function markCompleted(client, pendingId, paymentIntentId, receiptId) {
    await client.query(
        `UPDATE pending_orders
         SET status = $1,
             payment_intent_id = $2,
             receipt_id = $3
         WHERE id = $4`,
        ['paid', paymentIntentId, receiptId, pendingId]
    );
}

module.exports = {
    insertPendingOrder,
    updatePaymentLink,
    findById,
    findByPaymentLinkId,
    markCompleted,
};
