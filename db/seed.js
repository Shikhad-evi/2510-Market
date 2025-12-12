// seed.js (run with `npm run seed`)
require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    // Reset schema (if you've already run schema.sql you can skip DROPs)
    await db.query('BEGIN');

    // Simple reset (careful in prod)
    await db.query('TRUNCATE orders_products, orders, products, users RESTART IDENTITY CASCADE');

    // Insert products
    const products = [
      ['Wireless Mouse', 'Ergonomic wireless mouse', 25.99],
      ['Mechanical Keyboard', 'Tactile mechanical keyboard', 89.50],
      ['USB-C Charger', '65W fast charger', 29.99],
      ['Noise-Cancelling Headphones', 'Over-ear ANC headphones', 199.99],
      ['Laptop Stand', 'Aluminum adjustable stand', 34.99],
      ['1080p Webcam', 'HD webcam with microphone', 49.99],
      ['Portable SSD 1TB', 'High-speed external SSD', 129.99],
      ['Smartphone Case', 'Shockproof case', 15.00],
      ['Bluetooth Speaker', 'Portable speaker with deep bass', 59.99],
      ['Desk Lamp', 'LED lamp with dimmer', 22.50]
    ];
    for (const p of products) {
      await db.query('INSERT INTO products (title, description, price) VALUES ($1,$2,$3)', p);
    }

    // Create user with hashed password
    const username = 'seeduser';
    const passwordPlain = 'password123';
    const hashed = await bcrypt.hash(passwordPlain, 10);
    const userRes = await db.query('INSERT INTO users (username, password) VALUES ($1,$2) RETURNING id', [username, hashed]);
    const userId = userRes.rows[0].id;

    // Create an order linked to user
    const orderRes = await db.query('INSERT INTO orders (date, note, user_id) VALUES (CURRENT_DATE, $1, $2) RETURNING id', ['Seed order with 5 products', userId]);
    const orderId = orderRes.rows[0].id;

    // Add at least 5 distinct products to order
    await db.query('INSERT INTO orders_products (order_id, product_id, quantity) VALUES ($1,1,1),($1,2,2),($1,3,1),($1,4,1),($1,5,1)', [orderId]);

    await db.query('COMMIT');
    console.log('Seeding complete (use username "seeduser" and password "password123")');
    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Seeding failed', err);
    process.exit(1);
  }
}

seed();
