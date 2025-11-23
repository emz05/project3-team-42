const pool = require('../database');

const buildDailyReport = async (date, connection = pool) => {
    if (!date) {
        return null;
    }

    const summaryQuery = `
        SELECT $1::date AS report_date,
               COUNT(*) AS total_orders,
               COALESCE(SUM(amount), 0) AS total_sales,
               ROUND(COALESCE(AVG(amount), 0), 2) AS avg_order_value,
               MIN(transaction_time) AS first_transaction_time,
               MAX(transaction_time) AS last_transaction_time
        FROM receipt
        WHERE transaction_date = $1::date
    `;
    const paymentsQuery = `
        SELECT payment_method,
               COUNT(*) AS total_orders,
               COALESCE(SUM(amount), 0) AS total_sales
        FROM receipt
        WHERE transaction_date = $1::date
        GROUP BY payment_method
        ORDER BY total_sales DESC
    `;
    const [summaryRes, paymentsRes] = await Promise.all([
        connection.query(summaryQuery, [date]),
        connection.query(paymentsQuery, [date]),
    ]);

    const summary = summaryRes.rows[0] || {};
    return {
        ...summary,
        payment_breakdown: paymentsRes.rows,
    };
};

const Receipt = {
    // creates a new receipt and returns id of inserted row
    createReceipt: async (employeeId, totalAmount, paymentMethod, client = null, options = {}) => {
        const now = new Date();
        const transactionDate = now.toISOString().slice(0, 10);
        const transactionTime = now.toISOString().slice(11, 19);
        const customerPhone = options.customerPhone || null;

        // query can be dependent on multiple other queries in controller (ie. processing transaction: must all succeed or fail together)
        // default to pool.query() when router only uses one query
        const db = client || pool;

        const res = await db.query(
            `INSERT INTO receipt (employee_id, amount, payment_method, transaction_date, transaction_time, customer_phone) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [employeeId, totalAmount, paymentMethod, transactionDate, transactionTime, customerPhone]
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
    },

    // Revenue per employee (query #6)
    getRevenuePerEmployee: async (connection = pool) => {
        const res = await connection.query(
            `SELECT e.id AS employee_id,
                    e.first_name,
                    e.last_name,
                    COALESCE(SUM(r.amount), 0) AS total_revenue
             FROM employee e
             LEFT JOIN receipt r ON r.employee_id = e.id
             GROUP BY e.id, e.first_name, e.last_name
             ORDER BY total_revenue DESC, e.last_name ASC`
        );
        return res.rows;
    },

    // Orders per employee (query #9)
    getOrdersPerEmployee: async (connection = pool) => {
        const res = await connection.query(
            `SELECT e.id AS employee_id,
                    e.first_name,
                    e.last_name,
                    COUNT(r.id) AS total_orders,
                    COALESCE(SUM(r.amount), 0) AS total_revenue,
                    ROUND(COALESCE(AVG(r.amount), 0), 2) AS avg_order_value
             FROM employee e
             LEFT JOIN receipt r ON r.employee_id = e.id
             GROUP BY e.id, e.first_name, e.last_name
             ORDER BY total_revenue DESC, e.last_name ASC`
        );
        return res.rows;
    },

    // Highest single receipt amount (query #12)
    getHighestReceiptAmount: async (connection = pool) => {
        const res = await connection.query(
            `SELECT id,
                    amount AS max_receipt,
                    employee_id,
                    transaction_date,
                    transaction_time
             FROM receipt
             ORDER BY amount DESC
             LIMIT 1`
        );
        return res.rows[0] || null;
    },

    // Helper to generate standard X/Z POS summaries
    getDailyReport: (date, connection = pool) => buildDailyReport(date, connection),

    getXReport: async (connection = pool) => {
        const today = new Date().toISOString().slice(0, 10);
        return buildDailyReport(today, connection);
    },

    getZReport: async (connection = pool) => {
        const res = await connection.query(
            `SELECT MAX(transaction_date) AS latest_date FROM receipt`
        );
        const latest = res.rows[0]?.latest_date;
        if (!latest) return null;
        return buildDailyReport(latest, connection);
    },

    updateCustomerPhone: async (receiptId, phoneNumber, client = null) => {
        const db = client || pool;
        await db.query(
            `UPDATE receipt SET customer_phone = $1 WHERE id = $2`,
            [phoneNumber, receiptId]
        );
    },

    findLatestByPhone: async (phoneNumber, client = null) => {
        if (!phoneNumber) return null;
        const db = client || pool;
        const { rows } = await db.query(
            `SELECT *
             FROM receipt
             WHERE customer_phone = $1
             ORDER BY id DESC
             LIMIT 1`,
            [phoneNumber]
        );
        return rows[0] || null;
    },
};

module.exports = Receipt;
