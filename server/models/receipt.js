const pool = require('../database');

const Receipt = {
    // creates a new receipt and return id of inserted row
    createReceipt: async (employeeId, totalAmount, paymentMethod) => {
        const now = new Date();
        const res = await pool.query(
            `INSERT INTO receipt (employee_id, amount, payment_method, transaction_date, transaction_time) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [employeeId, totalAmount, paymentMethod, now, now]
        );
        return res.rows[0].id;
    },

    // returns last receipt id to store as current order number on client view
    getlatestReceiptId: async () => {
        const res = await pool.query('SELECT MAX(id) as latest_id FROM receipt');
        return res.rows[0].latest_id || 0;
    }
};

module.exports = Receipt;