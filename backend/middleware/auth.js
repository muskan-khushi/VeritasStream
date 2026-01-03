const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'veritas_secret_key_change_in_prod';

module.exports = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Access Denied. Please Login.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};