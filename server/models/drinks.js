const pool = require('../database');

const Drink = {
    // returns arr of all drink objects sorted by id
    getDrinks: async () => {
        const res = await pool query(
            'SELECT id, drink_name, drink_price, drink_image_path, category, is_seasonal FROM Drink ORDER BY id'
        );
        return res.rows;
    },

    // returns arr of categorized drinks sorted by id
    getDrinksByCategory: async (category) => {
        const res = await pool.query(
            'SELECT id, drink_name, drink_price, drink_image_path, category, is_seasonal FROM Drink WHERE category = $1 ORDER BY id',
            [category]
        );
        return res.rows;
    }
};

module.exports = Drink;