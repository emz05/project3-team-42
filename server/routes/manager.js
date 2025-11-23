const express = require('express');
const router = express.Router();
const Drink = require('../models/drinks');
const Receipt = require('../models/receipt');
const Inventory = require('../models/inventory');
const Employee = require('../models/employee');
const DrinkIngredient = require('../models/drinkIngredients');
const pool = require('../database');

const deriveSeasonal = (category) => {
  if (!category) return false;
  const c = String(category).toLowerCase();
  return c.includes('seasonal');
};

// List drinks
router.get('/drinks', async (req, res) => {
  try {
    const drinks = await Drink.getDrinks();
    res.json(drinks);
  } catch (e) {
    console.error('Manager get drinks: ', e);
    res.status(500).json({ error: 'Failed to fetch drinks' });
  }
});

// Add a drink
router.post('/drinks', async (req, res) => {
  try {
    const { category, drink_name, drink_price, drink_image_path } = req.body;
    if (!category || !drink_name || drink_price == null || !drink_image_path) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const is_seasonal = deriveSeasonal(category);
    const created = await Drink.addDrink({ category, drink_name, drink_price, drink_image_path, is_seasonal });
    res.status(201).json(created);
  } catch (e) {
    console.error('Manager add drink: ', e);
    res.status(500).json({ error: 'Failed to add drink' });
  }
});

// Update a drink
router.put('/drinks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const { category, drink_name, drink_price, drink_image_path } = req.body;
    if (!category || !drink_name || drink_price == null || !drink_image_path) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const is_seasonal = deriveSeasonal(category);
    const updated = await Drink.updateDrink(id, { category, drink_name, drink_price, drink_image_path, is_seasonal });
    res.json(updated);
  } catch (e) {
    console.error('Manager update drink: ', e);
    res.status(500).json({ error: 'Failed to update drink' });
  }
});

// Delete a drink
router.delete('/drinks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    // Delete ingredients first, then the drink
    await DrinkIngredient.deleteByDrinkId(id);
    await Drink.deleteDrink(id);
    res.status(204).end();
  } catch (e) {
    console.error('Manager delete drink: ', e);
    res.status(500).json({ error: 'Failed to delete drink' });
  }
});

// Drink Ingredient Routes
// Get all ingredients for a drink
router.get('/drinks/:id/ingredients', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid drink id' });
    const ingredients = await DrinkIngredient.getByDrinkId(id);
    res.json(ingredients);
  } catch (e) {
    console.error('Manager get drink ingredients: ', e);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

// Add an ingredient to a drink
router.post('/drinks/:id/ingredients', async (req, res) => {
  try {
    const drinkId = parseInt(req.params.id, 10);
    if (!Number.isFinite(drinkId)) return res.status(400).json({ error: 'Invalid drink id' });
    const { inventory_id, quantity_used } = req.body;
    if (!inventory_id || quantity_used == null) {
      return res.status(400).json({ error: 'Missing required fields: inventory_id, quantity_used' });
    }
    const ingredient = await DrinkIngredient.add({
      drink_id: drinkId,
      inventory_id: parseInt(inventory_id, 10),
      quantity_used: parseFloat(quantity_used)
    });
    res.status(201).json(ingredient);
  } catch (e) {
    console.error('Manager add drink ingredient: ', e);
    console.error('Error details:', e.message, e.stack);
    const errorMessage = e.message || 'Failed to add ingredient';
    res.status(500).json({ error: errorMessage });
  }
});

// Update an ingredient
router.put('/drinks/ingredients/:ingredientId', async (req, res) => {
  try {
    const ingredientId = parseInt(req.params.ingredientId, 10);
    if (!Number.isFinite(ingredientId)) return res.status(400).json({ error: 'Invalid ingredient id' });
    const { quantity_used } = req.body;
    if (quantity_used == null) {
      return res.status(400).json({ error: 'Missing required field: quantity_used' });
    }
    const ingredient = await DrinkIngredient.update(ingredientId, {
      quantity_used: parseFloat(quantity_used)
    });
    res.json(ingredient);
  } catch (e) {
    console.error('Manager update drink ingredient: ', e);
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// Delete an ingredient
router.delete('/drinks/ingredients/:ingredientId', async (req, res) => {
  try {
    const ingredientId = parseInt(req.params.ingredientId, 10);
    if (!Number.isFinite(ingredientId)) return res.status(400).json({ error: 'Invalid ingredient id' });
    await DrinkIngredient.delete(ingredientId);
    res.status(204).end();
  } catch (e) {
    console.error('Manager delete drink ingredient: ', e);
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { employeeId, dateFrom, dateTo } = req.query;
    const filters = [];
    const params = [];

    if (employeeId) {
      params.push(parseInt(employeeId, 10));
      filters.push(`r.employee_id = $${params.length}`);
    }

    if (dateFrom) {
      params.push(dateFrom);
      filters.push(`r.transaction_date >= $${params.length}`);
    }

    if (dateTo) {
      params.push(dateTo);
      filters.push(`r.transaction_date <= $${params.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const sql = `
      SELECT
        r.id AS receipt_id,
        r.transaction_date,
        r.transaction_time,
        r.amount AS total_amount,
        r.payment_method,
        r.employee_id,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name,
        'paid' AS status
      FROM receipt r
      LEFT JOIN employee e ON e.id = r.employee_id
      ${whereClause}
      ORDER BY r.id DESC
      LIMIT 500
    `;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('Manager list orders', e);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.get('/employees', async (req, res) => {
    try {
        const rows = await Employee.listEmployees();
        res.json(rows);
    } catch (e) {
        console.error('Manager list employees', e);
        res.status(500).json({ error: 'Failed to load employees' });
    }
});

// Add an employee
router.post('/employees', async (req, res) => {
    try {
        const { first_name, last_name, role, password, phone_number } = req.body;
        if (!first_name || !last_name || !role || !password || !phone_number) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const created = await Employee.createEmployee({
            first_name, last_name, role, password, phone_number
        });
        res.status(201).json(created);
    } catch (e) {
        console.error('Manager add employee: ', e);
        res.status(500).json({ error: 'Failed to add employee' });
    }
});

// Update an employee
router.put('/employees/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
        const { first_name, last_name, role, password, phone_number } = req.body;
        
        const pool = require('../database');
        const fields = {};
        const values = [];
        let paramIndex = 1;
        
        if (first_name !== undefined) {
            fields.first_name = first_name.trim();
            values.push(first_name.trim());
            paramIndex++;
        }
        if (last_name !== undefined) {
            fields.last_name = last_name.trim();
            values.push(last_name.trim());
            paramIndex++;
        }
        if (role !== undefined) {
            fields.role = role.trim();
            values.push(role.trim());
            paramIndex++;
        }
        if (password !== undefined) {
            fields.password = password.trim();
            values.push(password.trim());
            paramIndex++;
        }
        if (phone_number !== undefined) {
            fields.phone_number = phone_number.trim();
            values.push(phone_number.trim());
            paramIndex++;
        }
        
        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        const set = Object.keys(fields).map((k, i) => `${k} = $${i + 1}`).join(', ');
        const { rows } = await pool.query(
            `UPDATE Employee SET ${set} WHERE id = $${Object.keys(fields).length + 1} RETURNING id, password, first_name, last_name, role, phone_number`,
            [...values, id]
        );
        
        if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json(rows[0]);
    } catch (e) {
        console.error('Manager update employee: ', e);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// Delete an employee
router.delete('/employees/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
        
        const pool = require('../database');
        await pool.query('DELETE FROM Employee WHERE id = $1', [id]);
        res.status(204).end();
    } catch (e) {
        console.error('Manager delete employee: ', e);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

router.get('/inventory', async (req, res) => {
    try {
        const items = await Inventory.list({ lowStock: false, page: 1, limit: 500 });
        res.json(items || []);
    } catch (e) {
        console.error('Manager list inventory', e);
        res.status(500).json({ error: 'Failed to load inventory' });
    }
});

// Add an inventory item
router.post('/inventory', async (req, res) => {
    try {
        const { item, curramount, restockamount, unitcost, vendor, serving } = req.body;
        if (!item) {
            return res.status(400).json({ error: 'Missing required field: item' });
        }
        const created = await Inventory.createItem({
            item: item.trim(),
            curramount: curramount != null && curramount !== '' ? Number(curramount) : 0,
            restockamount: restockamount != null && restockamount !== '' ? Number(restockamount) : null,
            unitcost: unitcost != null && unitcost !== '' ? Number(unitcost) : null,
            vendor: vendor && vendor.trim() ? vendor.trim() : null,
            serving: serving != null && serving !== '' ? Number(serving) : null,
        });
        res.status(201).json(created);
    } catch (e) {
        console.error('Manager add inventory item: ', e);
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
});

// Update an inventory item
router.put('/inventory/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
        const { item, curramount, restockamount, unitcost, vendor, serving } = req.body;
        const updated = await Inventory.updateItem(id, {
            item,
            curramount: curramount != null ? Number(curramount) : undefined,
            restockamount: restockamount != null ? Number(restockamount) : null,
            unitcost: unitcost != null ? Number(unitcost) : null,
            vendor,
            serving: serving != null ? Number(serving) : null,
        });
        if (!updated) return res.status(404).json({ error: 'Item not found' });
        res.json(updated);
    } catch (e) {
        console.error('Manager update inventory item: ', e);
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
});

// Delete an inventory item
router.delete('/inventory/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
        await Inventory.deleteItem(id);
        res.status(204).end();
    } catch (e) {
        console.error('Manager delete inventory item: ', e);
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
});

// Restock an inventory item
router.post('/inventory/:id/restock', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
        
        const restocked = await Inventory.restockItem(id);
        res.json(restocked);
    } catch (e) {
        console.error('Manager restock inventory: ', e);
        res.status(500).json({ error: 'Failed to restock item' });
    }
});

async function fetchDashboardData() {
  const [
    weeklySales,
    hourlySales,
    peakDay,
    employeeList,
    revenuePerEmployee,
    ordersPerEmployee,
    lowStockInventory,
    drinkCounts,
    ordersPerCategory,
    salesPerDrink,
    cheapDrinks,
    highestReceipt,
    xReport,
    zReport,
  ] = await Promise.all([
    Receipt.getWeeklySalesHistory(),
    Receipt.getHourlySalesHistory(),
    Receipt.getPeakSalesDay(),
    Employee.listEmployees(),
    Receipt.getRevenuePerEmployee(),
    Receipt.getOrdersPerEmployee(),
    Inventory.getLowStockReport(),
    Drink.getDrinkCountPerCategory(),
    Drink.getOrdersPerCategory(),
    Drink.getSalesPerDrink(),
    Drink.getDrinksCheaperThan(5),
    Receipt.getHighestReceiptAmount(),
    Receipt.getXReport(),
    Receipt.getZReport(),
  ]);

  return {
    weeklySales,
    hourlySales,
    peakDay,
    employees: employeeList,
    revenuePerEmployee,
    ordersPerEmployee,
    lowStockInventory,
    drinkCounts,
    ordersPerCategory,
    salesPerDrink,
    cheapDrinks,
    highestReceipt,
    xReport,
    zReport,
  };
}

// Analytics endpoints
router.get('/analytics/weekly-sales', async (req, res) => {
  try {
    const rows = await Receipt.getWeeklySalesHistory();
    res.json(rows);
  } catch (e) {
    console.error('Manager analytics weekly-sales: ', e);
    res.status(500).json({ error: 'Failed to fetch weekly sales' });
  }
});

router.get('/analytics/hourly-sales', async (req, res) => {
  try {
    const rows = await Receipt.getHourlySalesHistory();
    res.json(rows);
  } catch (e) {
    console.error('Manager analytics hourly-sales: ', e);
    res.status(500).json({ error: 'Failed to fetch hourly sales' });
  }
});

router.get('/analytics/peak-day', async (req, res) => {
  try {
    const row = await Receipt.getPeakSalesDay();
    res.json(row);
  } catch (e) {
    console.error('Manager analytics peak-day: ', e);
    res.status(500).json({ error: 'Failed to fetch peak day' });
  }
});

router.get('/analytics/dashboard', async (req, res) => {
  try {
    const payload = await fetchDashboardData();
    res.json(payload);
  } catch (e) {
    console.error('Manager analytics dashboard: ', e);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const payload = await fetchDashboardData();
    res.json(payload);
  } catch (e) {
    console.error('Manager dashboard: ', e);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
