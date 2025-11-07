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
        await pool.query('DELETE FROM Drink WHERE id = $1', [id]);
        return { success: true };
    }
};

module.exports = Drink;
