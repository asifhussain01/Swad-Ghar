const Review = require('../models/Review');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Submit review for a completed order
// @route   POST /api/customer/reviews
// @access  Customer
const createReview = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      customerId: req.user._id,
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    if (order.orderStatus !== 'DELIVERED') {
      return sendError(res, 'You can only review an order after it has been delivered.', 400);
    }

    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return sendError(res, 'You have already submitted a review for this order.', 400);
    }

    const review = await Review.create({
      orderId: order._id,
      customerId: req.user._id,
      restaurantId: order.restaurantId,
      rating,
      comment: comment || '',
    });

    return sendSuccess(res, review, 'Thank you! Your review has been submitted.', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a specific restaurant
// @route   GET /api/customer/restaurants/:restaurantId/reviews
// @access  Public
const getRestaurantReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const reviews = await Review.find({
      restaurantId,
      moderationStatus: 'VISIBLE',
    })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(30);

    return sendSuccess(res, reviews, 'Restaurant reviews retrieved.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getRestaurantReviews,
};
