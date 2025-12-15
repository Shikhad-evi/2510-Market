const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('../db/client');

const router = express.Router();

router.post('/register', async (req, res) => {
const { username, password } = req.body;
if (!username || !password) return res.sendStatus(400);

const hashed = await bcrypt.hash(password, 10);
const { rows: [user] } = await client.query(
`INSERT INTO users(username,password)
VALUES ($1,$2) RETURNING id, username`,
[username, hashed]
);

const token = jwt.sign(user, process.env.JWT_SECRET);
res.send({ token });
});

router.post('/login', async (req, res) => {
const { username, password } = req.body;
if (!username || !password) return res.sendStatus(400);

const { rows: [user] } = await client.query(
`SELECT * FROM users WHERE username=$1`,
[username]
);

if (!user || !(await bcrypt.compare(password, user.password))) {
return res.sendStatus(401);
}

const token = jwt.sign({ id: user.id, username }, process.env.JWT_SECRET);
res.send({ token });
});

module.exports = router;