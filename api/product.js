const express = require('express');
const client = require('../db/client');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_, res) => {
const { rows } = await client.query('SELECT * FROM products');
res.send(rows);
});

router.get('/:id', async (req, res) => {
const { rows: [product] } = await client.query(
'SELECT * FROM products WHERE id=$1',
[req.params.id]
);
if (!product) return res.sendStatus(404);
res.send(product);
});

router.get('/:id/orders', requireUser, async (req, res) => {
const { rows: product } = await client.query(
'SELECT id FROM products WHERE id=$1',
[req.params.id]
);
if (!product.length) return res.sendStatus(404);

const { rows } = await client.query(
`SELECT o.* FROM orders o
JOIN orders_products op ON o.id=op.order_id
WHERE op.product_id=$1 AND o.user_id=$2`,
[req.params.id, req.user.id]
);

res.send(rows);
});

module.exports = router;