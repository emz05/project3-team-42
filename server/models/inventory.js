const pool = require('../database');

const LOW_STOCK_THRESHOLD = 20;

const Inventory = {
    // queries DB for inventory item matching given name
    // returns first matching inventory item id
    getInventoryIdByName: async (itemName) => {
        // case insensitive
        const query = 'SELECT id FROM inventory WHERE LOWER(item) = LOWER($1)';
        const result = await pool.query(query, [itemName.trim()]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].id;
    },

    // update all inventory items listed in drink recipe of listed drink id by quantity
    updateDrinkIngredients: async (drinkId, quantityOrdered) => {
        const query =
            `UPDATE inventory
            SET curramount = curramount - (di.quantity_used * $1)
            FROM drinkingredient di
            WHERE di.drink_id = $2 AND di.inventory_id = inventory.id`;

        await pool.query(query, [quantityOrdered, drinkId]);
    },

    // update inventory for used toppings by quantity
    updateTopping: async (toppingName, quantityOrdered) => {
        const inventoryId = await Inventory.getInventoryIdByName(toppingName);

        if (!inventoryId) {
            console.warn(`Topping "${toppingName}" not found in inventory`);
            return;
        }

        const query = 'UPDATE inventory SET curramount = curramount - $1 WHERE id = $2';
        await pool.query(query, [quantityOrdered, inventoryId]);
    },


    updateLowStockStatus: async (drinkId, toppings, client = pool) => {
        // update inventory item's (drink ingredients) boolean if low in stock
        const drinkQuery =
            `UPDATE inventory
            SET lowstock = (curramount < $1)
            WHERE id IN (
                SELECT inventory_id FROM drinkingredient WHERE drink_id = $2
            )`;
        await client.query(drinkQuery, [LOW_STOCK_THRESHOLD, drinkId]);

        // update topping boolean if low in stock
        if (toppings && toppings.length > 0) {
            const toppingQuery =
                `UPDATE inventory
                SET lowstock = (curramount < $1)
                WHERE LOWER(item) = ANY($2::text[])`;
            const toppingNames = toppings.map(t => t.trim().toLowerCase());
            await client.query(toppingQuery, [LOW_STOCK_THRESHOLD, toppingNames]);
        }
    }
};

module.exports = Inventory;