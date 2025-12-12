// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireUser } = require('./_utils');

/**
 * GET /products
 * - sends array of all products
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT id, title, description, price FROM products ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /products/:id
 * - 404 if not exist
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT id, title, description, price FROM products WHERE id = $1`, [id]);
    const product = result.rows[0];
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

/**
 * 🔒 GET /products/:id/orders
 * - must be protected
 * - sends 404 if product doesn't exist (even if user logged in)
 * - sends array of all orders made by the user that include this product
 */
router.get('/:id/orders', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    // check product exists
    const prodRes = await db.query(`SELECT id FROM products WHERE id = $1`, [id]);
    if (!prodRes.rows[0]) return res.status(404).json({ error: 'Product not found' });

    // find orders by this user that include the product
    const rows = await db.query(`
      SELECT o.id, o.date, o.note, o.user_id, op.quantity
      FROM orders o
      JOIN orders_products op ON o.id = op.order_id
      WHERE o.user_id = $1 AND op.product_id = $2
      ORDER BY o.date DESC
    `, [req.user.id, id]);

    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
