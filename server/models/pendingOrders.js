/*
- updates pending order table
- occurs when customer is inputting payment information
- status has to be successful for receipt and orders table to be loaded
 */
const pool = require('../database');

// sends pending order in db with pending status
async function insertPendingOrder(client, { orderId, employeeId, cart, totalAmount }) {
    const sql = `INSERT INTO pending_orders (order_id, employee_id, cart, total_amount, payment_link_id) VALUES ($1, $2, $3::jsonb, $4, $5) RETURNING id`;

    const values = [
        orderId,
        employeeId,
        JSON.stringify(cart ?? []),
        totalAmount,
        '__pending__',
    ];

    const { rows } = await client.query(sql, values);
    return rows[0];
}

// updates stripe link id in inserted pending order
async function updatePaymentLink(client, pendingId, paymentLinkId) {
    const sql = `UPDATE pending_orders SET payment_link_id = $1 WHERE id = $2`;

    await client.query(sql, [paymentLinkId, pendingId]);
}

async function findById(id) {
    return findOne('id', id);
}

async function findByPaymentLinkId(paymentLinkId) {
    return findOne('payment_link_id', paymentLinkId);
}

// switches status of pending order to paid
async function markCompleted(client, pendingId, paymentIntentId, receiptId) {
    const sql = `UPDATE pending_orders SET status = 'paid', payment_intent_id = $1,receipt_id = $2 WHERE id = $3`;

    await client.query(sql, [paymentIntentId, receiptId, pendingId]);
}

async function findOne(column, value) {
    const sql = `SELECT * FROM pending_orders WHERE ${column} = $1 LIMIT 1`;
    const { rows } = await pool.query(sql, [value]);
    return rows[0];
}

module.exports = { insertPendingOrder, updatePaymentLink, findById, findByPaymentLinkId, markCompleted, };
