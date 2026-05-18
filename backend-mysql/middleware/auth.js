const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

const auth = async (req, res, next) => {
  try {
    let token = null;

    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    const [rows] = await sequelize.query(
      'SELECT id, email, first_name, last_name, role, avatar_url, is_active FROM users WHERE id = ?',
      { replacements: [decoded.id] }
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'SyntaxError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    next();
  };
};

module.exports = { auth, authorize };
