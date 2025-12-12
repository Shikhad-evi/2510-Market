// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { createUserToken, hashPassword, comparePassword } = require('./_utils');

/**
 * POST /users/register
 * - 400 if missing username/password
 * - hashes password, creates user, sends token
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    const hashed = await hashPassword(password);
    const result = await db.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username`,
      [username, hashed]
    );
    const user = result.rows[0];
    const token = await createUserToken(user);
    res.json({ token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'username already exists' });
    }
    next(err);
  }
});

/**
 * POST /users/login
 * - 400 missing username/password
 * - validates credentials, sends token if valid
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    const result = await db.query(`SELECT id, username, password FROM users WHERE username = $1`, [username]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = await createUserToken(user);
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
