const express = require("express");
const router = express.Router();
const pool = require("../database");

// Get all distinct drink categories
router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category AS name 
      FROM drink
      ORDER BY category
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get drinks for a category
router.get("/categories/:category/drinks", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, drink_name, drink_price, drink_image_path FROM drink WHERE category = $1 ORDER BY id",
      [req.params.category]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single drink by ID
router.get("/item/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, drink_name, drink_price, drink_image_path, category FROM drink WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drink not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
