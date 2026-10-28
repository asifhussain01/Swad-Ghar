const Order = require('../models/Order');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Address = require('../models/Address');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const {
  createAndSendNotification,
  notifyRestaurantKitchen,
  notifyOrderStatusChange,
  notifyAdminChannel,
} = require('../services/notificationService');

// @desc    Place a new COD food order
// @route   POST /api/customer/orders
// @access  Customer
const createOrder = async (req, res, next) => {
  try {
    const { addressId, customerNotes } = req.body;

    // 1. Fetch user's cart
    const cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart || !cart.items || cart.items.length === 0) {
      return sendError(res, 'Your cart is empty. Please add food items before ordering.', 400);
    }

    // 2. Validate Restaurant status
    const restaurant = await Restaurant.findById(cart.restaurantId);
    if (!restaurant) {
      return sendError(res, 'Restaurant is no longer available.', 404);
    }
    if (restaurant.approvalStatus !== 'APPROVED') {
      return sendError(res, 'This restaurant is currently not accepting orders on SwadGhar.', 400);
    }
    if (!restaurant.isOpen) {
      return sendError(res, 'Restaurant is currently closed.', 400);
    }

    // 3. Validate Delivery Address
    const address = await Address.findOne({ _id: addressId, customerId: req.user._id });
    if (!address) {
      return sendError(res, 'Invalid delivery address selected.', 404);
    }

    // 4. Validate menu items, stock, and calculate immutable prices
    let itemSubtotal = 0;
    const itemsSnapshot = [];

    for (const entry of cart.items) {
      const item = await MenuItem.findById(entry.menuItemId);
      if (!item) {
        return sendError(res, 'An item in your cart is no longer available.', 400);
      }
      if (!item.isAvailable) {
        return sendError(res, `"${item.name}" is currently sold out. Please remove it from your cart.`, 400);
      }
      if (!item.restaurantId.equals(restaurant._id)) {
        return sendError(res, 'Cross-restaurant cart item detected.', 400);
      }

      const unitPrice = item.discountPrice || item.price;
      const subtotal = unitPrice * entry.quantity;
      itemSubtotal += subtotal;

      itemsSnapshot.push({
        menuItemId: item._id,
        name: item.name,
        price: unitPrice,
        quantity: entry.quantity,
        subtotal,
        isVegetarian: item.isVegetarian,
      });
    }

    if (itemSubtotal < (restaurant.minimumOrderValue || 0)) {
      return sendError(
        res,
        `Minimum order value for ${restaurant.name} is ₹${restaurant.minimumOrderValue}. Your subtotal is ₹${itemSubtotal}.`,
        400
      );
    }

    const deliveryFee = restaurant.deliveryFee || 0;
    const discount = 0; // Discount calculation hook if coupons enabled
    const finalAmount = itemSubtotal + deliveryFee - discount;

    // 5. Generate human-readable Order Number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SG-${Date.now().toString().slice(-6)}${randomSuffix}`;

    // 6. Create frozen Address Snapshot
    const deliveryAddressSnapshot = {
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      fullAddress: address.fullAddress,
      landmark: address.landmark || '',
      city: address.city,
      pincode: address.pincode,
    };

    // 7. Save Order to Database (COD only, status PLACED, paymentStatus PENDING)
    const order = await Order.create({
      orderNumber,
      customerId: req.user._id,
      restaurantId: restaurant._id,
      items: itemsSnapshot,
      itemSubtotal,
      deliveryFee,
      discount,
      finalAmount,
      deliveryAddress: deliveryAddressSnapshot,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      customerNotes: customerNotes || '',
      statusTimeline: [
        {
          status: 'PLACED',
          timestamp: new Date(),
          note: 'Order placed by customer via Cash on Delivery.',
          updatedBy: req.user._id,
        },
      ],
    });

    // 8. Clear customer cart
    cart.items = [];
    cart.restaurantId = null;
    await cart.save();

    // 9. Real-time Kitchen alert & customer notification
    notifyRestaurantKitchen(restaurant._id, order, restaurant.ownerId);

    await createAndSendNotification({
      userId: req.user._id,
      title: 'Order Placed Successfully!',
      message: `Your order #${order.orderNumber} for ₹${order.finalAmount} (COD) has been sent to ${restaurant.name}.`,
      type: 'ORDER_UPDATE',
      referenceId: order._id,
    });

    await createAndSendNotification({
      userId: restaurant.ownerId,
      title: '🔔 New Incoming Order!',
      message: `New order #${order.orderNumber} received for ₹${order.finalAmount} (COD). Please review and accept.`,
      type: 'NEW_ORDER',
      referenceId: order._id,
    });

    notifyAdminChannel('admin_new_order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      finalAmount: order.finalAmount,
      restaurant: restaurant.name,
      customer: req.user.name,
    });

    return sendSuccess(res, order, 'Order placed successfully with Cash on Delivery.', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's orders history
// @route   GET /api/customer/orders
// @access  Customer
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { customerId: req.user._id };

    if (status) {
      filter.orderStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate({
        path: 'restaurantId',
        select: 'name logoUrl phone email address ownerId',
        populate: {
          path: 'ownerId',
          select: 'name phone email',
        },
      })
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

// @desc    Get single order details by ID
// @route   GET /api/customer/orders/:id
// @access  Customer
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customerId: req.user._id,
    }).populate({
      path: 'restaurantId',
      select: 'name logoUrl phone email address ownerId openingHours estimatedPrepTimeMinutes',
      populate: {
        path: 'ownerId',
        select: 'name phone email',
      },
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    return sendSuccess(res, order, 'Order details retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Customer cancels order (Permitted ONLY if orderStatus === 'PLACED')
// @route   PATCH /api/customer/orders/:id/cancel
// @access  Customer
const cancelOrder = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      customerId: req.user._id,
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    if (order.orderStatus !== 'PLACED') {
      return sendError(
        res,
        `Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase().replace(/_/g, ' ')}. Please contact the restaurant.`,
        400
      );
    }

    order.orderStatus = 'CANCELLED';
    order.cancellationReason = cancellationReason || 'Cancelled by customer';
    order.statusTimeline.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      note: `Cancelled by customer. Reason: ${order.cancellationReason}`,
      updatedBy: req.user._id,
    });

    await order.save();

    // Notify Restaurant
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant) {
      await createAndSendNotification({
        userId: restaurant.ownerId,
        title: 'Order Cancelled',
        message: `Order #${order.orderNumber} was cancelled by the customer before confirmation.`,
        type: 'ORDER_UPDATE',
        referenceId: order._id,
      });
    }

    notifyOrderStatusChange(order.customerId, order);

    return sendSuccess(res, order, 'Order has been cancelled successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
