const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication token missing. Please log in.', 401);
    }

    const jwtSecret = process.env.JWT_SECRET || 'swadghar_super_secure_jwt_secret_key_2026_indian_food_delivery';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User no longer exists.', 401);
    }

    if (user.status === 'SUSPENDED') {
      return sendError(res, 'Your account has been suspended. Please contact support.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 'Invalid or expired session. Please log in again.', 401);
    }
    return sendError(res, 'Authentication error.', 500);
  }
};

module.exports = { authenticate };
