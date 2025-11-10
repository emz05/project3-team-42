const pool = require('../database');

const LOW_STOCK_THRESHOLD = 20;

const Inventory = {
    // queries DB for inventory item matching given name
    // returns first matching inventory item id
    getInventoryIdByName: async (itemName, connection = pool) => {
        // case insensitive
        const query = 'SELECT id FROM inventory WHERE LOWER(item) = LOWER($1)';
        const result = await connection.query(query, [itemName.trim()]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].id;
    },

    // update all inventory items listed in drink recipe of listed drink id by quantity
    updateDrinkIngredients: async (drinkId, quantityOrdered, connection = pool) => {
        const query =
            `UPDATE inventory
            SET curramount = curramount - (di.quantity_used * $1)
            FROM drinkingredient di
            WHERE di.drink_id = $2 AND di.inventory_id = inventory.id`;

        await connection.query(query, [quantityOrdered, drinkId]);
    },

    // update inventory for used toppings by quantity
    updateTopping: async (toppingName, quantityOrdered, connection = pool) => {
        const inventoryID = await Inventory.getInventoryIdByName(toppingName, connection);

        if (!inventoryID) {
            console.warn(`Topping "${toppingName}" not found in inventory`);
            return;
        }

        const query = 'UPDATE inventory SET curramount = curramount - $1 WHERE id = $2';
        await connection.query(query, [quantityOrdered, inventoryID]);
    },


    updateLowStockStatus: async (drinkId, toppings, connection = pool) => {
        // update inventory item's (drink ingredients) boolean if low in stock
        const drinkQuery =
            `UPDATE inventory
            SET lowstock = (curramount < $1)
            WHERE id IN (
                SELECT inventory_id FROM drinkingredient WHERE drink_id = $2
            )`;
        await connection.query(drinkQuery, [LOW_STOCK_THRESHOLD, drinkId]);

        // update topping boolean if low in stock
        if (toppings && toppings.length > 0) {
            const toppingQuery =
                `UPDATE inventory
                SET lowstock = (curramount < $1)
                WHERE LOWER(item) = ANY($2::text[])`;
            const toppingNames = toppings.map(t => t.trim().toLowerCase());
            await connection.query(toppingQuery, [LOW_STOCK_THRESHOLD, toppingNames]);
        }
    }
};

// List inventory items, optionally only those low in stock
async function list({ lowStock = false, page = 1, limit = 20 }, connection = pool) {
  const offset = (page - 1) * limit;

  const baseSelect = `
    SELECT id, item, curramount, lowstock
    FROM inventory
  `;

  const whereClause = lowStock ? `WHERE lowstock = true` : ``;
  const orderClause = `ORDER BY item ASC`;
  const paging = `LIMIT $1 OFFSET $2`;

  const query = [baseSelect, whereClause, orderClause, paging].join(' ').trim();

  const { rows } = await connection.query(query, [limit, offset]);
  return rows;
}

// Create a new inventory item
async function createItem({ item, curramount = 0 }, connection = pool) {
  if (!item || typeof item !== 'string') {
    throw new Error('ITEM_REQUIRED');
  }
  const qty = Number(curramount) || 0;

  // lowstock is derived from the threshold constant you already use
  const low = qty < LOW_STOCK_THRESHOLD;

  const { rows } = await connection.query(
    `INSERT INTO inventory (item, curramount, lowstock)
     VALUES ($1, $2, $3)
     RETURNING id, item, curramount, lowstock`,
    [item.trim(), qty, low]
  );
  return rows[0];
}

// Update an inventory item (e.g., name or quantity)
async function updateItem(id, fields = {}, connection = pool) {
  const updates = {};
  if (typeof fields.item === 'string') updates.item = fields.item.trim();
  if (fields.curramount !== undefined) updates.curramount = Number(fields.curramount);

  // nothing to update
  if (Object.keys(updates).length === 0) {
    const { rows } = await connection.query(
      `SELECT id, item, curramount, lowstock FROM inventory WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  // recompute lowstock if quantity provided (else keep existing)
  if (updates.curramount !== undefined) {
    updates.lowstock = updates.curramount < LOW_STOCK_THRESHOLD;
  }

  // dynamic SET clause
  const cols = Object.keys(updates);
  const vals = Object.values(updates);
  const set = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');

  const { rows } = await connection.query(
    `UPDATE inventory SET ${set}
     WHERE id = $${cols.length + 1}
     RETURNING id, item, curramount, lowstock`,
    [...vals, id]
  );
  return rows[0] || null;
}


module.exports = {
  ...Inventory,
  list,
  createItem,
  updateItem,
};
