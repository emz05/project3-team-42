const pool = require('../database');

const DrinkIngredient = {
    // Get all ingredients for a specific drink
    getByDrinkId: async (drinkId) => {
        const res = await pool.query(
            `SELECT 
                di.id,
                di.drink_id,
                di.inventory_id,
                di.quantity_used,
                i.item AS inventory_item
            FROM drinkingredient di
            JOIN inventory i ON di.inventory_id = i.id
            WHERE di.drink_id = $1
            ORDER BY i.item ASC`,
            [drinkId]
        );
        return res.rows;
    },

    // Add a new ingredient to a drink
    add: async ({ drink_id, inventory_id, quantity_used }) => {
        // Check if this ingredient already exists for this drink
        const existing = await pool.query(
            'SELECT id FROM drinkingredient WHERE drink_id = $1 AND inventory_id = $2',
            [drink_id, inventory_id]
        );

        if (existing.rows.length > 0) {
            // Update existing instead of creating duplicate
            const res = await pool.query(
                'UPDATE drinkingredient SET quantity_used = $1 WHERE id = $2 RETURNING id, drink_id, inventory_id, quantity_used',
                [quantity_used, existing.rows[0].id]
            );
            // Return with inventory item name for consistency
            const ingredientRow = res.rows[0];
            const inventoryRes = await pool.query('SELECT item FROM inventory WHERE id = $1', [inventory_id]);
            return {
                ...ingredientRow,
                inventory_item: inventoryRes.rows[0]?.item || null
            };
        }

        // Get the max ID and set sequence to avoid conflicts
        // This handles cases where the sequence is out of sync
        try {
            // First, try to sync the sequence
            await pool.query(`
                SELECT setval(
                    pg_get_serial_sequence('drinkingredient', 'id'),
                    COALESCE((SELECT MAX(id) FROM drinkingredient), 0) + 1,
                    false
                )
            `);
        } catch (seqError) {
            // If sequence sync fails, continue anyway - the insert might still work
            console.warn('Could not sync drinkingredient sequence:', seqError.message);
        }

        // Now try the insert
        try {
            const res = await pool.query(
                'INSERT INTO drinkingredient (drink_id, inventory_id, quantity_used) VALUES ($1, $2, $3) RETURNING id, drink_id, inventory_id, quantity_used',
                [drink_id, inventory_id, quantity_used]
            );
            
            // Return with inventory item name for consistency
            const ingredientRow = res.rows[0];
            const inventoryRes = await pool.query('SELECT item FROM inventory WHERE id = $1', [inventory_id]);
            return {
                ...ingredientRow,
                inventory_item: inventoryRes.rows[0]?.item || null
            };
        } catch (insertError) {
            // If insert fails due to primary key conflict, the sequence is still out of sync
            // Try to fix it and retry once
            if (insertError.code === '23505' && insertError.constraint === 'drinkingredient_pkey') {
                // Reset sequence to max + 1
                await pool.query(`
                    SELECT setval(
                        pg_get_serial_sequence('drinkingredient', 'id'),
                        (SELECT MAX(id) FROM drinkingredient) + 1,
                        false
                    )
                `);
                
                // Retry the insert
                const res = await pool.query(
                    'INSERT INTO drinkingredient (drink_id, inventory_id, quantity_used) VALUES ($1, $2, $3) RETURNING id, drink_id, inventory_id, quantity_used',
                    [drink_id, inventory_id, quantity_used]
                );
                
                const ingredientRow = res.rows[0];
                const inventoryRes = await pool.query('SELECT item FROM inventory WHERE id = $1', [inventory_id]);
                return {
                    ...ingredientRow,
                    inventory_item: inventoryRes.rows[0]?.item || null
                };
            }
            // Re-throw if it's a different error
            throw insertError;
        }
    },

    // Update an existing ingredient
    update: async (id, { quantity_used }) => {
        const res = await pool.query(
            'UPDATE drinkingredient SET quantity_used = $1 WHERE id = $2 RETURNING id, drink_id, inventory_id, quantity_used',
            [quantity_used, id]
        );
        return res.rows[0];
    },

    // Delete an ingredient from a drink
    delete: async (id) => {
        await pool.query('DELETE FROM drinkingredient WHERE id = $1', [id]);
        return { success: true };
    },

    // Delete all ingredients for a drink (useful when deleting a drink)
    deleteByDrinkId: async (drinkId) => {
        await pool.query('DELETE FROM drinkingredient WHERE drink_id = $1', [drinkId]);
        return { success: true };
    }
};

module.exports = DrinkIngredient;

