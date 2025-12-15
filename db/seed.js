const client = require('./client');
const bcrypt = require('bcrypt');

async function seed() {
await client.connect();

const hashed = await bcrypt.hash('password123', 10);

const { rows: [user] } = await client.query(
`INSERT INTO users(username, password)
VALUES ($1,$2) RETURNING *`,
['testuser', hashed]
);

const products = await Promise.all(
Array.from({ length: 10 }).map((_, i) =>
client.query(
`INSERT INTO products(title, description, price)
VALUES ($1,$2,$3) RETURNING *`,
[`Product ${i+1}`, `Description ${i+1}`, (i+1)*10]
)
)
);

const { rows: [order] } = await client.query(
`INSERT INTO orders(date, note, user_id)
VALUES (CURRENT_DATE, 'First order', $1) RETURNING *`,
[user.id]
);

for (let i = 0; i < 5; i++) {
await client.query(
`INSERT INTO orders_products(order_id, product_id, quantity)
VALUES ($1,$2,$3)`,
[order.id, products[i].rows[0].id, i+1]
);
}

console.log('Database seeded');
await client.end();
}

seed();