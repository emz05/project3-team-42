const pool = require('../database');

const Receipt = {
    // creates a new receipt and returns id of inserted row
    createReceipt: async (employeeId, totalAmount, paymentMethod, client = null) => {
        const now = new Date();
        const transactionDate = now.toISOString().slice(0, 10);
        const transactionTime = now.toISOString().slice(11, 19);

        // query can be dependent on multiple other queries in controller (ie. processing transaction: must all succeed or fail together)
        // default to pool.query() when router only uses one query
        const db = client || pool;

        const res = await db.query(
            `INSERT INTO receipt (employee_id, amount, payment_method, transaction_date, transaction_time) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [employeeId, totalAmount, paymentMethod, transactionDate, transactionTime]
        );
        return res.rows[0].id;
    },

    // returns last receipt id to store as current order number on client view
    getlatestReceiptId: async (client = null) => {
        const db = client || pool;
        const res = await db.query('SELECT MAX(id) as latest_id FROM receipt');
        return res.rows[0].latest_id || 0;
    }
};

module.exports = Receipt;