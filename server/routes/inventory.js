// server/routes/inventory.js
const express = require('express');
const router = express.Router();
const Inventory = require('../models/inventory');

// GET /api/inventory?lowStock=true&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const lowStock = String(req.query.lowStock || 'false').toLowerCase() === 'true';
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);

    const items = await Inventory.list({ lowStock, page, limit });
    res.json({ items, page, limit, lowStock });
  } catch (e) {
    console.error('INVENTORY_LIST_FAILED', e);
    res.status(500).json({ error: 'INVENTORY_LIST_FAILED', details: e.message });
  }
});

// POST /api/inventory
router.post('/', async (req, res) => {
  try {
    const { item, curramount } = req.body || {};
    if (!item) return res.status(400).json({ error: 'ITEM_REQUIRED' });

    const created = await Inventory.createItem({ item, curramount });
    res.status(201).json(created);
  } catch (e) {
    console.error('INVENTORY_CREATE_FAILED', e);
    res.status(500).json({ error: 'INVENTORY_CREATE_FAILED', details: e.message });
  }
});

// PATCH /api/inventory/:id
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'INVALID_ID' });

    const { item, curramount } = req.body || {};
    const updated = await Inventory.updateItem(id, { item, curramount });
    if (!updated) return res.status(404).json({ error: 'NOT_FOUND' });

    res.json(updated);
  } catch (e) {
    console.error('INVENTORY_UPDATE_FAILED', e);
    res.status(500).json({ error: 'INVENTORY_UPDATE_FAILED', details: e.message });
  }
});


module.exports = router;
