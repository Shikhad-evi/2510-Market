// routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireUser } = require('./_utils');

/**
 * 🔒 POST /orders
 * - 400 if no date
 * - creates a new order by logged-in user and sends with 201
 */
router.post('/', requireUser, async (req, res, next) => {
  try {
    const { date, note } = req.body || {};
    if (!date) return res.status(400).json({ error: 'date is required' });

    const result = await db.query(
      `INSERT INTO orders (date, note, user_id) VALUES ($1, $2, $3) RETURNING id, date, note, user_id`,
      [date, note || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * 🔒 GET /orders
 * - sends array of all orders made by logged-in user
 */
router.get('/', requireUser, async (req, res, next) => {
  try {
    const result = await db.query(`SELECT id, date, note, user_id FROM orders WHERE user_id = $1 ORDER BY date DESC`, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * 🔒 GET /orders/:id
 * - 404 if the order does not exist
 * - 403 if logged-in user is not the user who made the order
 */
router.get('/:id', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT id, date, note, user_id FROM orders WHERE id = $1`, [id]);
    const order = result.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

/**
 * 🔒 POST /orders/:id/products
 * - 404 if order doesn't exist
 * - 403 if logged-in user not the one who made the order
 * - 400 if body missing productId or quantity
 * - 400 if productId references a product that does not exist
 * - adds quantity to order and sends created orders_products with 201
 */
router.post('/:id/products', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId, quantity } = req.body || {};

    // validate order
    const orderRes = await db.query(`SELECT id, user_id FROM orders WHERE id = $1`, [id]);
    const order = orderRes.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    if (!productId || !quantity) return res.status(400).json({ error: 'productId and quantity required' });

    // check product exists
    const prodRes = await db.query(`SELECT id FROM products WHERE id = $1`, [productId]);
    if (!prodRes.rows[0]) return res.status(400).json({ error: 'Product does not exist' });

    // insert or update quantity (but spec: "adds the specified quantity of the product to the order and sends the created orders_products record")
    // For simplicity, if the PK (order_id, product_id) exists we will return 400 (or we could update). We'll attempt insert and return created row.
    const insertRes = await db.query(
      `INSERT INTO orders_products (order_id, product_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING order_id, product_id, quantity`,
      [id, productId, quantity]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    // handle unique violation if already exists
    if (err.code === '23505') {
      // existing entry — you may choose to update instead.
      return res.status(400).json({ error: 'Product already added to order' });
    }
    next(err);
  }
});

/**
 * 🔒 GET /orders/:id/products
 * - 404 if order doesn't exist
 * - 403 if logged-in user not the one who made the order
 * - sends array of products in the order
 */
router.get('/:id/products', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderRes = await db.query(`SELECT id, user_id FROM orders WHERE id = $1`, [id]);
    const order = orderRes.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const rows = await db.query(`
      SELECT p.id, p.title, p.description, p.price, op.quantity
      FROM products p
      JOIN orders_products op ON p.id = op.product_id
      WHERE op.order_id = $1
    `, [id]);

    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
