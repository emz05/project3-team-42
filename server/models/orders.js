const pool = require('../database');

const Orders = {
    // creates a new order and returns id of inserted row
    addOrderItem: async (receiptId, drinkId, quantity, orderPrice, iceCustomization, sweetnessCustomization, toppingsCustomization) => {
        const res = await pool.query(
            `INSERT INTO orders (drink_id, receipt_id, quantity, order_price, ice_customization, sweetness_customization, toppings_customization)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [drinkId, receiptId, quantity, orderPrice, iceCustomization, sweetnessCustomization, toppingsCustomization]
        );
        return res.rows[0].id;
    }
};

module.exports = Orders;
