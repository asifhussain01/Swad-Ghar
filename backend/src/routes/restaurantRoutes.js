const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const {
  restaurantRegisterSchema,
  menuItemSchema,
  orderStatusUpdateSchema,
} = require('../validators/schemas');

const ownerAuth = [authenticate, authorize('RESTAURANT_OWNER')];

// Onboarding & Profile
router.post('/register', ownerAuth, validate(restaurantRegisterSchema), restaurantController.registerRestaurant);
router.get('/me', ownerAuth, restaurantController.getMyRestaurant);
router.patch('/me', ownerAuth, restaurantController.updateMyRestaurant);

// Menu Management
router.get('/menu', ownerAuth, restaurantController.getMyMenu);
router.post('/menu', ownerAuth, validate(menuItemSchema), restaurantController.addMenuItem);
router.patch('/menu/:itemId', ownerAuth, restaurantController.updateMenuItem);
router.delete('/menu/:itemId', ownerAuth, restaurantController.deleteMenuItem);

// Order Management
router.get('/orders', ownerAuth, restaurantController.getRestaurantOrders);
router.get('/orders/:id', ownerAuth, restaurantController.getRestaurantOrderById);
router.patch('/orders/:id/status', ownerAuth, validate(orderStatusUpdateSchema), restaurantController.updateOrderStatus);
router.patch('/orders/:id/confirm-payment', ownerAuth, restaurantController.confirmCODPayment);

// Reports & Sales
router.get('/reports', ownerAuth, restaurantController.getRestaurantReports);

module.exports = router;
