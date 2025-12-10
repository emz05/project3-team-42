const express = require("express");
const router = express.Router();
const pool = require("../database");

// Get all distinct drink categories (seasonal too)
router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH base_categories AS (
        SELECT DISTINCT TRIM(category) AS name FROM drink
      ),
      seasonal AS (
        SELECT 'Seasonal' AS name FROM drink WHERE EXISTS (
          SELECT 1 FROM drink WHERE is_seasonal = true
        ) LIMIT 1
      )
      SELECT DISTINCT name
      FROM (
        SELECT name FROM base_categories
        UNION ALL
        SELECT name FROM seasonal
      ) AS categories
      ORDER BY name;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get drinks for a category
router.get("/categories/:category/drinks", async (req, res) => {
  try {
    const { category } = req.params;
    const isSeasonal = category && category.toLowerCase() === "seasonal";

    const result = await pool.query(
      isSeasonal
        ? "SELECT id, drink_name, drink_price, drink_image_path, description, allergens FROM drink WHERE is_seasonal = true ORDER BY id"
        : "SELECT id, drink_name, drink_price, drink_image_path, description, allergens FROM drink WHERE category = $1 ORDER BY id",
      isSeasonal ? [] : [category]
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
      "SELECT id, drink_name, drink_price, drink_image_path, description, allergens, category FROM drink WHERE id = $1",
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
