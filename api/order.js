const express = require('express');
router.get('/:id', requireUser, async (req, res) => {
const { rows: [order] } = await client.query(
'SELECT * FROM orders WHERE id=$1',
[req.params.id]
);

if (!order) return res.sendStatus(404);
if (order.user_id !== req.user.id) return res.sendStatus(403);

res.send(order);
});

router.post('/:id/products', requireUser, async (req, res) => {
const { productId, quantity } = req.body;
if (!productId || !quantity) return res.sendStatus(400);

const { rows: [order] } = await client.query(
'SELECT * FROM orders WHERE id=$1',
[req.params.id]
);

if (!order) return res.sendStatus(404);
if (order.user_id !== req.user.id) return res.sendStatus(403);

const { rows: product } = await client.query(
'SELECT id FROM products WHERE id=$1',
[productId]
);
if (!product.length) return res.sendStatus(400);

const { rows: [op] } = await client.query(
`INSERT INTO orders_products(order_id,product_id,quantity)
VALUES ($1,$2,$3) RETURNING *`,
[req.params.id, productId, quantity]
);

res.status(201).send(op);
});

router.get('/:id/products', requireUser, async (req, res) => {
const { rows: [order] } = await client.query(
'SELECT * FROM orders WHERE id=$1',
[req.params.id]
);

if (!order) return res.sendStatus(404);
if (order.user_id !== req.user.id) return res.sendStatus(403);

const { rows } = await client.query(
`SELECT p.*, op.quantity FROM products p
JOIN orders_products op ON p.id=op.product_id
WHERE op.order_id=$1`,
[req.params.id]
);

res.send(rows);
});

module.exports = router;