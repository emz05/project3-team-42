// server/routes/orders.js
const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET /api/orders?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const from = req.query.from || '1900-01-01';
    const to = req.query.to || '2100-12-31';
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    // basic query combining receipts + orders
    const query = `
      SELECT r.id AS receipt_id,
             r.employee_id,
             r.amount AS total_amount,
             r.payment_method,
             r.transaction_date,
             r.transaction_time,
             COUNT(o.id) AS num_items
      FROM receipt r
      LEFT JOIN orders o ON o.receipt_id = r.id
      WHERE r.transaction_date BETWEEN $1 AND $2
      GROUP BY r.id
      ORDER BY r.id DESC
      LIMIT $3 OFFSET $4
    `;
    const { rows } = await pool.query(query, [from, to, limit, offset]);
    res.json({ orders: rows, page, limit });
  } catch (e) {
    console.error('ORDER_HISTORY_FAILED', e);
    res.status(500).json({ error: 'ORDER_HISTORY_FAILED', details: e.message });
  }
});

// GET /api/orders/:receiptId  → receipt meta + line items
router.get('/:receiptId', async (req, res) => {
  try {
    const receiptId = parseInt(req.params.receiptId, 10);
    if (Number.isNaN(receiptId)) return res.status(400).json({ error: 'INVALID_ID' });

    // receipt meta
    const r = await pool.query(
      `SELECT id AS receipt_id, employee_id, amount AS total_amount,
              payment_method, transaction_date, transaction_time
       FROM receipt
       WHERE id = $1`,
      [receiptId]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' });

    // line items
    const items = await pool.query(
      `SELECT id, drink_id, quantity, order_price,
              ice_customization, sweetness_customization, toppings_customization
       FROM orders
       WHERE receipt_id = $1
       ORDER BY id ASC`,
      [receiptId]
    );

    res.json({ receipt: r.rows[0], items: items.rows });
  } catch (e) {
    console.error('ORDER_DETAIL_FAILED', e);
    res.status(500).json({ error: 'ORDER_DETAIL_FAILED', details: e.message });
  }
});

// POST /api/orders
// body: { employee_id, payment_method, items:[{drink_id, quantity, order_price, ice_customization, sweetness_customization, toppings_customization: [names]}] }
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { employee_id, payment_method, items } = req.body || {};
    if (!employee_id || !payment_method || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'MISSING_FIELDS' });
    }

    // 1) compute total
    const total = items.reduce((sum, it) => sum + Number(it.order_price || 0) * Number(it.quantity || 0), 0);

    // 2) begin tx
    await client.query('BEGIN');

    // 3) create receipt
    const Receipt = require('../models/receipt');
    const receiptId = await Receipt.createReceipt(employee_id, total, payment_method, client);

    // 4) insert order items + update inventory
    const Orders = require('../models/orders');
    const Inventory = require('../models/inventory');

    for (const it of items) {
      const {
        drink_id,
        quantity = 1,
        order_price = 0,
        ice_customization = null,
        sweetness_customization = null,
        toppings_customization = [] // array of topping names
      } = it;

      if (!drink_id) throw new Error('MISSING_DRINK_ID');

      // add line item
      await Orders.addOrderItem(
        receiptId,
        drink_id,
        quantity,
        order_price,
        ice_customization,
        sweetness_customization,
        JSON.stringify(toppings_customization || []),
        client
      );

      // decrement ingredients for this drink
      await Inventory.updateDrinkIngredients(drink_id, quantity, client);

      // decrement toppings, if any
      if (Array.isArray(toppings_customization)) {
        for (const name of toppings_customization) {
          if (name) await Inventory.updateTopping(name, quantity, client);
        }
      }

      // refresh lowstock flags for these items
      await Inventory.updateLowStockStatus(drink_id, toppings_customization || [], client);
    }

    // 5) commit
    await client.query('COMMIT');

    res.status(201).json({ receipt_id: receiptId, items_count: items.length, total_amount: total });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('ORDER_CREATE_FAILED', e);
    res.status(500).json({ error: 'ORDER_CREATE_FAILED', details: e.message });
  } finally {
    client.release();
  }
});


module.exports = router;
