const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const {
  createAndSendNotification,
  notifyOrderStatusChange,
  notifyAdminChannel,
} = require('../services/notificationService');
const { logAuditAction } = require('../services/auditService');

// @desc    Register a new restaurant (Owner application)
// @route   POST /api/restaurant/register
// @access  Restaurant Owner
const registerRestaurant = async (req, res, next) => {
  try {
    const existing = await Restaurant.findOne({ ownerId: req.user._id });
    if (existing) {
      return sendError(res, 'A restaurant profile already exists for your account.', 400);
    }

    const {
      name,
      description,
      address,
      phone,
      email,
      cuisineType,
      logoUrl,
      coverImageUrl,
      openingHours,
      estimatedPrepTimeMinutes,
      deliveryFee,
      minimumOrderValue,
    } = req.body;

    const restaurant = await Restaurant.create({
      ownerId: req.user._id,
      name,
      description,
      address,
      phone,
      email,
      cuisineType,
      logoUrl: logoUrl || undefined,
      coverImageUrl: coverImageUrl || undefined,
      openingHours: openingHours || undefined,
      estimatedPrepTimeMinutes: estimatedPrepTimeMinutes || 25,
      deliveryFee: deliveryFee !== undefined ? deliveryFee : 30,
      minimumOrderValue: minimumOrderValue !== undefined ? minimumOrderValue : 99,
      approvalStatus: 'PENDING',
    });

    notifyAdminChannel('admin_new_restaurant', {
      restaurantId: restaurant._id,
      name: restaurant.name,
      city: restaurant.address.city,
      ownerEmail: req.user.email,
    });

    return sendSuccess(
      res,
      restaurant,
      'Restaurant application submitted successfully! It will be reviewed by admin for approval.',
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner's restaurant profile
// @route   GET /api/restaurant/me
// @access  Restaurant Owner
const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'No restaurant registered yet.', 404);
    }
    return sendSuccess(res, restaurant, 'Restaurant profile retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant profile & open/closed status
// @route   PATCH /api/restaurant/me
// @access  Restaurant Owner
const updateMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'Restaurant profile not found.', 404);
    }

    const updatableFields = [
      'name',
      'description',
      'address',
      'phone',
      'email',
      'cuisineType',
      'logoUrl',
      'coverImageUrl',
      'openingHours',
      'isOpen',
      'estimatedPrepTimeMinutes',
      'deliveryFee',
      'minimumOrderValue',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        restaurant[field] = req.body[field];
      }
    });

    await restaurant.save();
    return sendSuccess(res, restaurant, 'Restaurant profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant menu items
// @route   GET /api/restaurant/menu
// @access  Restaurant Owner
const getMyMenu = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'Restaurant profile not found.', 404);
    }

    const items = await MenuItem.find({ restaurantId: restaurant._id }).sort({ category: 1, name: 1 });
    return sendSuccess(res, items, 'Menu items retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Add dish to menu
// @route   POST /api/restaurant/menu
// @access  Restaurant Owner
const addMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'Restaurant profile not found.', 404);
    }

    const { name, description, category, price, discountPrice, imageUrl, isVegetarian, isAvailable, prepTimeMinutes } =
      req.body;

    const item = await MenuItem.create({
      restaurantId: restaurant._id,
      name,
      description,
      category,
      price,
      discountPrice,
      imageUrl: imageUrl || undefined,
      isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      prepTimeMinutes: prepTimeMinutes || 20,
    });

    return sendSuccess(res, item, 'Dish added to menu successfully.', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update dish
// @route   PATCH /api/restaurant/menu/:itemId
// @access  Restaurant Owner
const updateMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'Restaurant profile not found.', 404);
    }

    const item = await MenuItem.findOne({ _id: req.params.itemId, restaurantId: restaurant._id });
    if (!item) {
      return sendError(res, 'Dish not found or unauthorized.', 404);
    }

    const fields = [
      'name',
      'description',
      'category',
      'price',
      'discountPrice',
      'imageUrl',
      'isVegetarian',
      'isAvailable',
      'prepTimeMinutes',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();
    return sendSuccess(res, item, 'Menu item updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete dish
// @route   DELETE /api/restaurant/menu/:itemId
// @access  Restaurant Owner
const deleteMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'Restaurant profile not found.', 404);
    }

    const item = await MenuItem.findOneAndDelete({ _id: req.params.itemId, restaurantId: restaurant._id });
    if (!item) {
      return sendError(res, 'Dish not found.', 404);
    }

    return sendSuccess(res, null, 'Dish removed from menu.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant orders
// @route   GET /api/restaurant/orders
// @access  Restaurant Owner
const getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'Restaurant profile not found.', 404);
    }

    const { status, paymentStatus, page = 1, limit = 50 } = req.query;
    const filter = { restaurantId: restaurant._id };

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    return sendSuccess(
      res,
      {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Orders retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status in workflow
// @route   PATCH /api/restaurant/orders/:id/status
// @access  Restaurant Owner
const updateOrderStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'Restaurant profile not found.', 404);
    }

    const { status, rejectionReason, note } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id,
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    // Validate workflow state transitions
    const validTransitions = {
      PLACED: ['CONFIRMED', 'REJECTED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_DELIVERY'],
      READY_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: [], // Final state
      REJECTED: [],  // Final state
      CANCELLED: [], // Final state
    };

    if (!validTransitions[order.orderStatus].includes(status)) {
      return sendError(
        res,
        `Invalid status transition from "${order.orderStatus}" to "${status}".`,
        400
      );
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    if (status === 'REJECTED') {
      order.rejectionReason = rejectionReason || 'Restaurant unavailable to fulfill order';
    }

    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status} by restaurant`,
      updatedBy: req.user._id,
    });

    await order.save();

    // Notify customer
    notifyOrderStatusChange(order.customerId, order);

    const statusMessages = {
      CONFIRMED: `Your order #${order.orderNumber} has been accepted by ${restaurant.name}!`,
      PREPARING: `The kitchen is now preparing your delicious food for order #${order.orderNumber}.`,
      READY_FOR_DELIVERY: `Order #${order.orderNumber} is packed and out for delivery by the restaurant!`,
      DELIVERED: `Order #${order.orderNumber} has been delivered. Please pay ₹${order.finalAmount} in cash if not already paid.`,
      REJECTED: `Order #${order.orderNumber} was declined by the restaurant: ${order.rejectionReason}`,
    };

    if (statusMessages[status]) {
      await createAndSendNotification({
        userId: order.customerId,
        title: `Order Update: ${status.replace(/_/g, ' ')}`,
        message: statusMessages[status],
        type: 'ORDER_UPDATE',
        referenceId: order._id,
      });
    }

    await logAuditAction({
      performedBy: req.user._id,
      role: 'RESTAURANT_OWNER',
      action: 'ORDER_STATUS_UPDATED',
      entityType: 'ORDER',
      entityId: order._id,
      previousState: { orderStatus: previousStatus },
      newState: { orderStatus: status },
      details: `Restaurant owner updated order status to ${status}`,
    });

    return sendSuccess(res, order, `Order status updated to ${status}.`);
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm cash collection for Cash on Delivery (COD)
// @route   PATCH /api/restaurant/orders/:id/confirm-payment
// @access  Restaurant Owner
const confirmCODPayment = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'Restaurant profile not found.', 404);
    }

    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id,
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    if (order.paymentStatus === 'PAID') {
      return sendError(res, 'Cash collection has already been confirmed for this order.', 400);
    }

    const previousPaymentStatus = order.paymentStatus;
    order.paymentStatus = 'PAID';
    order.paidAt = new Date();
    order.paymentCollectedBy = req.user._id;

    order.statusTimeline.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Cash on Delivery (₹${order.finalAmount}) confirmed collected by restaurant.`,
      updatedBy: req.user._id,
    });

    await order.save();

    // Audit log
    await logAuditAction({
      performedBy: req.user._id,
      role: 'RESTAURANT_OWNER',
      action: 'PAYMENT_COLLECTION_CONFIRMED',
      entityType: 'PAYMENT',
      entityId: order._id,
      previousState: { paymentStatus: previousPaymentStatus },
      newState: { paymentStatus: 'PAID', paidAt: order.paidAt },
      details: `Cash collection of ₹${order.finalAmount} confirmed for order #${order.orderNumber}.`,
    });

    notifyOrderStatusChange(order.customerId, order);

    await createAndSendNotification({
      userId: order.customerId,
      title: 'Payment Acknowledged (Cash on Delivery)',
      message: `Cash payment of ₹${order.finalAmount} for order #${order.orderNumber} has been recorded as received by ${restaurant.name}.`,
      type: 'ORDER_UPDATE',
      referenceId: order._id,
    });

    return sendSuccess(res, order, 'Cash collection recorded successfully. Payment status is now PAID.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant reports & sales summary
// @route   GET /api/restaurant/reports
// @access  Restaurant Owner
const getRestaurantReports = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return sendError(res, 'Restaurant profile not found.', 404);
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayOrders, allOrders, completedOrders] = await Promise.all([
      Order.find({ restaurantId: restaurant._id, createdAt: { $gte: startOfToday } }),
      Order.find({ restaurantId: restaurant._id }),
      Order.find({ restaurantId: restaurant._id, orderStatus: 'DELIVERED' }),
    ]);

    const totalRevenuePaid = allOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    const pendingCashCollection = allOrders
      .filter((o) => o.orderStatus === 'DELIVERED' && o.paymentStatus === 'PENDING')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    const todaySales = todayOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    return sendSuccess(
      res,
      {
        summary: {
          totalOrders: allOrders.length,
          completedOrders: completedOrders.length,
          todayOrdersCount: todayOrders.length,
          todaySales,
          totalRevenuePaid,
          pendingCashCollection,
        },
        ordersByStatus: {
          placed: allOrders.filter((o) => o.orderStatus === 'PLACED').length,
          preparing: allOrders.filter((o) => o.orderStatus === 'PREPARING' || o.orderStatus === 'CONFIRMED').length,
          readyForDelivery: allOrders.filter((o) => o.orderStatus === 'READY_FOR_DELIVERY').length,
          delivered: completedOrders.length,
          cancelled: allOrders.filter((o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED').length,
        },
      },
      'Reports retrieved successfully.'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerRestaurant,
  getMyRestaurant,
  updateMyRestaurant,
  getMyMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getRestaurantOrders,
  updateOrderStatus,
  confirmCODPayment,
  getRestaurantReports,
};
