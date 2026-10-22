const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'codegraph-secret-jwt-key-2026';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please sign in again.' });
  }

  req.user = decoded;
  next();
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
};

module.exports = {
  JWT_SECRET,
  requireAuth,
  optionalAuth,
  verifyToken,
};
