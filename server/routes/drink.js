const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET all drinks
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM drink ORDER BY id;');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching drinks:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
