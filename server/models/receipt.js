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
    },

    // Special Query #1: Weekly Sales History
    getWeeklySalesHistory: async (connection = pool) => {
        const res = await connection.query(
            `SELECT EXTRACT(week FROM transaction_date) AS week,
                    EXTRACT(isoyear FROM transaction_date) AS year,
                    COUNT(*) AS total_orders
             FROM receipt
             GROUP BY week, year
             ORDER BY year, week`
        );
        return res.rows;
    },

    // Special Query #2: Realistic Sales History (by hour)
    getHourlySalesHistory: async (connection = pool) => {
        const res = await connection.query(
            `SELECT TO_CHAR(transaction_time, 'HH12:00 AM') AS hour_of_day,
                    COUNT(*) AS total_orders,
                    SUM(amount) AS total_sales
             FROM receipt
             GROUP BY TO_CHAR(transaction_time, 'HH12:00 AM')
             ORDER BY hour_of_day`
        );
        return res.rows;
    },

    // Special Query #3: Peak Sales Day (sum of top 10 orders per day)
    getPeakSalesDay: async (connection = pool) => {
        const res = await connection.query(
            `WITH Top10 AS (
                SELECT transaction_date,
                       amount,
                       ROW_NUMBER() OVER (PARTITION BY transaction_date ORDER BY amount DESC) AS rnk
                FROM receipt
            )
            SELECT transaction_date,
                   SUM(amount) AS sum
            FROM Top10
            WHERE rnk <= 10
            GROUP BY transaction_date
            ORDER BY sum DESC
            LIMIT 1`
        );
        return res.rows[0] || null;
    }
};

module.exports = Receipt;
