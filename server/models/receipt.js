const pool = require('../database');

const Receipt = {
    // creates a new receipt and returns id of inserted row
    createReceipt: async (employeeId, totalAmount, paymentMethod, connection = pool) => {
        const now = new Date();
        const transactionDate = now.toISOString().slice(0, 10);
        const transactionTime = now.toISOString().slice(11, 19);

        const res = await pool.query(
            `INSERT INTO receipt (employee_id, amount, payment_method, transaction_date, transaction_time) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [employeeId, totalAmount, paymentMethod, transactionDate, transactionTime]
        );
        return res.rows[0].id;
    },

    // returns last receipt id to store as current order number on client view
    getlatestReceiptId: async (connection = pool) => {
        const res = await pool.query('SELECT MAX(id) as latest_id FROM receipt');
        return res.rows[0].latest_id || 0;
    }
};

module.exports = Receipt;