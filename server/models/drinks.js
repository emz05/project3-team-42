const pool = require('../database');

const Drink = {
    // returns arr of all drink objects sorted by id
    getDrinks: async () => {
        const res = await pool.query(
            'SELECT id, drink_name, drink_price, drink_image_path, category, is_seasonal FROM Drink ORDER BY id'
        );
        return res.rows;
    },

    // returns arr of categorized drinks sorted by id
    getDrinksByCategory: async (category) => {
        const res = await pool.query(
            'SELECT id, drink_name, drink_price, drink_image_path, category, is_seasonal FROM Drink WHERE LOWER(category) = LOWER($1) ORDER BY id',
            [category]
        );
        return res.rows;
    },

    addDrink: async ({ drink_name, drink_price, drink_image_path, category, is_seasonal }) => {
        const res = await pool.query(
            'INSERT INTO Drink (drink_name, drink_price, drink_image_path, category, is_seasonal) VALUES ($1, $2, $3, $4, $5) RETURNING id, drink_name, drink_price, drink_image_path, category, is_seasonal',
            [drink_name, drink_price, drink_image_path, category, is_seasonal]
        );
        return res.rows[0];
    },

    updateDrink: async (id, { drink_name, drink_price, drink_image_path, category, is_seasonal }) => {
        const res = await pool.query(
            'UPDATE Drink SET drink_name = $1, drink_price = $2, drink_image_path = $3, category = $4, is_seasonal = $5 WHERE id = $6 RETURNING id, drink_name, drink_price, drink_image_path, category, is_seasonal',
            [drink_name, drink_price, drink_image_path, category, is_seasonal, id]
        );
        return res.rows[0];
    },

    deleteDrink: async (id) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM orders WHERE drink_id = $1', [id]);
            await client.query('DELETE FROM Drink WHERE id = $1', [id]);
            await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Drink count per category (query #5)
    getDrinkCountPerCategory: async (connection = pool) => {
        const res = await connection.query(
            `SELECT category,
                    COUNT(*) AS drink_count
             FROM Drink
             GROUP BY category
             ORDER BY category`
        );
        return res.rows;
    },

    // Orders per drink category (query #7)
    getOrdersPerCategory: async (connection = pool) => {
        const res = await connection.query(
            `SELECT d.category,
                    COALESCE(SUM(o.quantity), 0) AS total_orders
             FROM orders o
             JOIN Drink d ON o.drink_id = d.id
             GROUP BY d.category
             ORDER BY total_orders DESC`
        );
        return res.rows;
    },

    // Sales per individual drink (query #8)
    getSalesPerDrink: async (connection = pool) => {
        const res = await connection.query(
            `SELECT d.drink_name,
                    COALESCE(SUM(o.quantity), 0) AS total_orders,
                    COALESCE(SUM(o.order_price * o.quantity), 0) AS total_revenue
             FROM orders o
             JOIN Drink d ON o.drink_id = d.id
             GROUP BY d.drink_name
             ORDER BY total_revenue DESC`
        );
        return res.rows;
    },

    // Drinks cheaper than given price (query #11)
    getDrinksCheaperThan: async (price, connection = pool) => {
        const target = Number(price) || 5;
        const res = await connection.query(
            `SELECT drink_name,
                    drink_price AS price
             FROM Drink
             WHERE drink_price < $1
             ORDER BY drink_price ASC`,
            [target]
        );
        return res.rows;
    },
};

module.exports = Drink;
