const { sendError } = require('../utils/apiResponse');
const Restaurant = require('../models/Restaurant');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized access.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, `Forbidden: Requires one of [${roles.join(', ')}] role.`, 403);
    }

    next();
  };
};

// Ensure the logged in restaurant owner owns the restaurant being operated on
const ensureRestaurantOwner = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'RESTAURANT_OWNER') {
      return sendError(res, 'Access restricted to restaurant owners.', 403);
    }

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'No restaurant profile found for your account. Please register your restaurant first.', 404);
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    return sendError(res, 'Failed to verify restaurant ownership.', 500);
  }
};

module.exports = { authorize, ensureRestaurantOwner };
