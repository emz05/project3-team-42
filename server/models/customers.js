/*
- database connection to update customer information
- beyond feature usage: allows viewing of past history upon phone number
 */
const pool = require('../database');

function normalizePhone(value) {
    if (!value) {
        return '';
    }
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
        return digits.slice(1);
    }
    if (digits.length === 10) {
        return digits;
    }
    return '';
}

async function upsertCustomer(phone, client = null) {
    const db = client || pool;
    const normalized = normalizePhone(phone);
    if (!normalized) {
        throw new Error('INVALID_PHONE');
    }

    const query = `
        INSERT INTO customers (phone)
        VALUES ($1)
        ON CONFLICT (phone)
        DO UPDATE SET updated_at = NOW()
        RETURNING *`;

    const { rows } = await db.query(query, [normalized]);
    return rows[0];
}

async function recordOrder({ phoneNumber, receiptId, totalAmount, cart }, client = null) {
    const db = client || pool;
    const normalized = normalizePhone(phoneNumber);
    if (!normalized || !receiptId) {
        throw new Error('INVALID_CUSTOMER_ORDER');
    }

    const customer = await upsertCustomer(normalized, db);
    const cartJson = JSON.stringify(cart || []);
    const amount = Number(totalAmount) || 0;

    await db.query(
        `INSERT INTO customer_orders (customer_id, receipt_id, cart, total_amount)
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT (customer_id, receipt_id)
         DO UPDATE SET cart = EXCLUDED.cart, total_amount = EXCLUDED.total_amount`,
        [customer.id, receiptId, cartJson, amount]
    );

    await db.query(
        `UPDATE customers
         SET last_receipt_id = $1,
             last_cart = $2::jsonb,
             last_total = $3,
             last_ordered_at = NOW()
         WHERE id = $4`,
        [receiptId, cartJson, amount, customer.id]
    );

    return { customerId: customer.id, phone: normalized };
}

async function getRecentOrders(phone, limit = 5, client = null) {
    const db = client || pool;
    const normalized = normalizePhone(phone);
    if (!normalized) {
        return [];
    }

    const query = `
        SELECT co.receipt_id,
               co.cart,
               co.total_amount,
               co.created_at,
               r.transaction_date,
               r.transaction_time
        FROM customer_orders co
        JOIN customers c ON c.id = co.customer_id
        LEFT JOIN receipt r ON r.id = co.receipt_id
        WHERE c.phone = $1
        ORDER BY co.created_at DESC
        LIMIT $2`;

    const { rows } = await db.query(query, [normalized, limit]);
    return rows;
}

async function getLastOrder(phone, client = null) {
    const db = client || pool;
    const normalized = normalizePhone(phone);
    if (!normalized) {
        return null;
    }

    const query = `
        SELECT last_receipt_id, last_cart, last_total, last_ordered_at
        FROM customers
        WHERE phone = $1
        LIMIT 1`;

    const { rows } = await db.query(query, [normalized]);
    return rows[0] || null;
}

async function saveSession(phone, sessionState, client = null) {
    const db = client || pool;
    const normalized = normalizePhone(phone);
    if (!normalized) {
        return;
    }

    await upsertCustomer(normalized, db);
    await db.query(
        `UPDATE customers SET session_state = $2::jsonb, updated_at = NOW() WHERE phone = $1`,
        [normalized, JSON.stringify(sessionState || {})]
    );
}

async function getSession(phone, client = null) {
    const db = client || pool;
    const normalized = normalizePhone(phone);
    if (!normalized) {
        return null;
    }

    const { rows } = await db.query(
        `SELECT session_state FROM customers WHERE phone = $1 LIMIT 1`,
        [normalized]
    );
    return rows[0]?.session_state || null;
}

module.exports = {
    normalizePhone,
    recordOrder,
    getRecentOrders,
    getLastOrder,
    saveSession,
    getSession,
};
