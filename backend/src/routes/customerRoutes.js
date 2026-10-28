const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const reviewController = require('../controllers/reviewController');
const complaintController = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const {
  cartItemSchema,
  addressSchema,
  orderCreateSchema,
  orderCancelSchema,
  reviewSchema,
  complaintSchema,
} = require('../validators/schemas');

// Public Discovery Endpoints
router.get('/restaurants', customerController.getRestaurants);
router.get('/restaurants/:id', customerController.getRestaurantById);
router.get('/restaurants/:restaurantId/reviews', reviewController.getRestaurantReviews);
router.get('/categories', customerController.getCategories);

// Authenticated Customer Only Endpoints
const customerAuth = [authenticate, authorize('CUSTOMER')];

// Cart
router.get('/cart', customerAuth, cartController.getCart);
router.post('/cart/items', customerAuth, validate(cartItemSchema), cartController.addToCart);
router.delete('/cart/items/:itemId', customerAuth, cartController.removeItem);
router.delete('/cart', customerAuth, cartController.clearCart);

// Delivery Addresses
router.get('/addresses', customerAuth, customerController.getAddresses);
router.post('/addresses', customerAuth, validate(addressSchema), customerController.addAddress);
router.delete('/addresses/:id', customerAuth, customerController.deleteAddress);

// Orders
router.post('/orders', customerAuth, validate(orderCreateSchema), orderController.createOrder);
router.get('/orders', customerAuth, orderController.getMyOrders);
router.get('/orders/:id', customerAuth, orderController.getOrderById);
router.patch('/orders/:id/cancel', customerAuth, validate(orderCancelSchema), orderController.cancelOrder);

// Reviews & Ratings
router.post('/reviews', customerAuth, validate(reviewSchema), reviewController.createReview);

// Complaints & Disputes
router.post('/complaints', customerAuth, validate(complaintSchema), complaintController.fileComplaint);
router.get('/complaints', customerAuth, complaintController.getMyComplaints);

// Notifications
router.get('/notifications', customerAuth, customerController.getNotifications);
router.patch('/notifications/:id/read', customerAuth, customerController.markNotificationRead);

module.exports = router;
