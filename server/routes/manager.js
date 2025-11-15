const express = require('express');
const router = express.Router();
const Drink = require('../models/drinks');
const Receipt = require('../models/receipt');
const Inventory = require('../models/inventory');
const Employee = require('../models/employee');

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
    await Drink.deleteDrink(id);
    res.status(204).end();
  } catch (e) {
    console.error('Manager delete drink: ', e);
    res.status(500).json({ error: 'Failed to delete drink' });
  }
});

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

    res.json({
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
    });
  } catch (e) {
    console.error('Manager analytics dashboard: ', e);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
