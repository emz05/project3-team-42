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

    // update inventory item's boolean if low in stock
    markLowStockForDrink: async (drinkId) => {
        const query =
            `UPDATE inventory
            SET lowstock = (curramount < $1)
            WHERE id IN (
                SELECT inventory_id 
                FROM drinkingredient 
                WHERE drink_id = $2
            )`;

        await pool.query(query, [LOW_STOCK_THRESHOLD, drinkId]);
    },

    // update topping's boolean if low in stock
    markLowStockForTopping: async (toppingName) => {
        const inventoryId = await Inventory.getInventoryIdByName(toppingName);

        if (!inventoryId) {
            return;
        }

        const query = 'UPDATE inventory SET lowstock = (curramount < $1) WHERE id = $2';
        await pool.query(query, [LOW_STOCK_THRESHOLD, inventoryId]);
    }
};

module.exports = Inventory;