const jwt = require('jsonwebtoken');

function requireUser(req, res, next) {
const auth = req.headers.authorization;
if (!auth) return res.sendStatus(401);

try {
const token = auth.split(' ')[1];
const user = jwt.verify(token, process.env.JWT_SECRET);
req.user = user;
next();
} catch {
res.sendStatus(401);
}
}

module.exports = { requireUser };