const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const RestaurantCategory = require('../models/RestaurantCategory');
const Review = require('../models/Review');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { logAuditAction } = require('../services/auditService');
const { createAndSendNotification } = require('../services/notificationService');

// @desc    Admin Dashboard KPI Metrics & Analytics
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboardMetrics = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      totalRestaurants,
      pendingRestaurants,
      approvedRestaurants,
      suspendedRestaurants,
      totalOrders,
      placedOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      allOrdersFinancials,
      recentOrders,
      recentRestaurants,
      openComplaints,
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ approvalStatus: 'PENDING' }),
      Restaurant.countDocuments({ approvalStatus: 'APPROVED' }),
      Restaurant.countDocuments({ approvalStatus: 'SUSPENDED' }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'PLACED' }),
      Order.countDocuments({ orderStatus: { $in: ['CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY'] } }),
      Order.countDocuments({ orderStatus: 'DELIVERED' }),
      Order.countDocuments({ orderStatus: { $in: ['CANCELLED', 'REJECTED'] } }),
      Order.find({}, 'finalAmount orderStatus paymentStatus createdAt'),
      Order.find({})
        .populate('customerId', 'name phone')
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Restaurant.find({}).sort({ createdAt: -1 }).limit(5),
      Complaint.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
    ]);

    // Financial calculations (strictly distinguished)
    const totalOrderValue = allOrdersFinancials.reduce((sum, o) => sum + o.finalAmount, 0);
    const completedOrderValue = allOrdersFinancials
      .filter((o) => o.orderStatus === 'DELIVERED')
      .reduce((sum, o) => sum + o.finalAmount, 0);
    const confirmedCashCollected = allOrdersFinancials
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.finalAmount, 0);
    const pendingCashCollection = allOrdersFinancials
      .filter((o) => o.paymentStatus === 'PENDING' && o.orderStatus === 'DELIVERED')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    // Generate monthly sales breakdown for Recharts
    const monthlySalesMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    months.forEach((m) => {
      monthlySalesMap[m] = { month: m, orders: 0, orderValue: 0, cashCollected: 0 };
    });

    allOrdersFinancials.forEach((ord) => {
      const orderDate = new Date(ord.createdAt);
      if (orderDate.getFullYear() === currentYear) {
        const monthKey = months[orderDate.getMonth()];
        monthlySalesMap[monthKey].orders += 1;
        monthlySalesMap[monthKey].orderValue += ord.finalAmount;
        if (ord.paymentStatus === 'PAID') {
          monthlySalesMap[monthKey].cashCollected += ord.finalAmount;
        }
      }
    });

    const monthlyChartData = Object.values(monthlySalesMap);

    return sendSuccess(
      res,
      {
        counts: {
          totalCustomers,
          totalRestaurants,
          pendingRestaurants,
          approvedRestaurants,
          suspendedRestaurants,
          totalOrders,
          placedOrders,
          activeOrders,
          completedOrders,
          cancelledOrders,
          openComplaints,
        },
        financials: {
          totalOrderValue,
          completedOrderValue,
          confirmedCashCollected,
          pendingCashCollection,
          currency: 'INR',
          note: 'Total Order Value is the gross value of all placed orders. Confirmed Cash Collected reflects verified COD receipts.',
        },
        monthlyChartData,
        recentOrders,
        recentRestaurants,
      },
      'Dashboard metrics retrieved successfully.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered users (Customers & Owners)
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Explicitly exclude passwords from returning
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return sendSuccess(
      res,
      {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Users retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (ACTIVE / SUSPENDED)
// @route   PATCH /api/admin/users/:id/status
// @access  Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return sendError(res, 'Invalid user status.', 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    if (user.role === 'ADMIN') {
      return sendError(res, 'Cannot change status of an Administrator account.', 403);
    }

    const previousStatus = user.status;
    user.status = status;
    await user.save();

    await logAuditAction({
      performedBy: req.user._id,
      role: 'ADMIN',
      action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      entityType: 'USER',
      entityId: user._id,
      previousState: { status: previousStatus },
      newState: { status },
      details: reason || `Admin toggled user status to ${status}`,
    });

    return sendSuccess(res, user, `User account ${status.toLowerCase()} successfully.`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all restaurants with approval filters
// @route   GET /api/admin/restaurants
// @access  Admin
const getRestaurants = async (req, res, next) => {
  try {
    const { approvalStatus, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { 'address.city': new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const restaurants = await Restaurant.find(filter)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Restaurant.countDocuments(filter);

    return sendSuccess(
      res,
      {
        restaurants,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Restaurants retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject restaurant application
// @route   PATCH /api/admin/restaurants/:id/approval
// @access  Admin
const updateRestaurantApproval = async (req, res, next) => {
  try {
    const { approvalStatus, rejectionReason } = req.body;
    if (!['APPROVED', 'REJECTED', 'PENDING', 'SUSPENDED'].includes(approvalStatus)) {
      return sendError(res, 'Invalid approval status.', 400);
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return sendError(res, 'Restaurant not found.', 404);
    }

    const previousStatus = restaurant.approvalStatus;
    restaurant.approvalStatus = approvalStatus;

    if (approvalStatus === 'REJECTED') {
      restaurant.rejectionReason = rejectionReason || 'Failed platform criteria verification';
    } else if (approvalStatus === 'APPROVED') {
      restaurant.rejectionReason = '';
    }

    await restaurant.save();

    await logAuditAction({
      performedBy: req.user._id,
      role: 'ADMIN',
      action: `RESTAURANT_${approvalStatus}`,
      entityType: 'RESTAURANT',
      entityId: restaurant._id,
      previousState: { approvalStatus: previousStatus },
      newState: { approvalStatus, rejectionReason: restaurant.rejectionReason },
      details: `Admin changed restaurant approval to ${approvalStatus}`,
    });

    // Notify restaurant owner
    await createAndSendNotification({
      userId: restaurant.ownerId,
      title: `Restaurant Application ${approvalStatus}`,
      message:
        approvalStatus === 'APPROVED'
          ? `Congratulations! Your restaurant "${restaurant.name}" has been approved. You can now start receiving orders.`
          : `Your restaurant application for "${restaurant.name}" was ${approvalStatus.toLowerCase()}. Reason: ${restaurant.rejectionReason}`,
      type: 'RESTAURANT_APPROVAL',
      referenceId: restaurant._id,
    });

    return sendSuccess(res, restaurant, `Restaurant status updated to ${approvalStatus}.`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders across platform with filters
// @route   GET /api/admin/orders
// @access  Admin
const getOrders = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, search, page = 1, limit = 25 } = req.query;
    const filter = {};

    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.orderNumber = new RegExp(search, 'i');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('customerId', 'name phone email')
      .populate('restaurantId', 'name address phone')
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

// @desc    Export food orders records to Excel/CSV for stores & platform
// @route   GET /api/admin/orders/export-excel
// @access  Admin
const exportOrdersExcel = async (req, res, next) => {
  try {
    const { restaurantId, orderStatus, paymentStatus, search, startDate, endDate } = req.query;
    const filter = {};

    if (restaurantId) filter.restaurantId = restaurantId;
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) filter.orderNumber = new RegExp(search, 'i');

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('customerId', 'name phone email')
      .populate('restaurantId', 'name address phone')
      .populate('paymentCollectedBy', 'name role')
      .sort({ createdAt: -1 });

    // Helper to escape CSV values for Excel
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${str}"`;
    };

    const headers = [
      'Order Number',
      'Date Placed',
      'Time Placed',
      'Restaurant Name',
      'Restaurant City',
      'Customer Name',
      'Customer Phone',
      'Delivery Address',
      'Dishes Ordered (Items)',
      'Total Item Quantity',
      'Food Subtotal (INR)',
      'Delivery Fee (INR)',
      'Discount (INR)',
      'Final Bill Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Cash Verified By',
      'Settlement Date & Time',
      'Order Status',
      'Special Customer Notes',
    ];

    const rows = orders.map((ord) => {
      const orderDate = new Date(ord.createdAt);
      const dateStr = orderDate.toLocaleDateString('en-IN');
      const timeStr = orderDate.toLocaleTimeString('en-IN');

      const itemsStr = (ord.items || [])
        .map((it) => `${it.quantity}x ${it.name} (Rs. ${it.subtotal})`)
        .join('; ');

      const totalQty = (ord.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);

      const addr = ord.deliveryAddress
        ? `${ord.deliveryAddress.fullAddress || ''}, ${ord.deliveryAddress.landmark ? ord.deliveryAddress.landmark + ', ' : ''}${ord.deliveryAddress.city || ''} - ${ord.deliveryAddress.pincode || ''}`
        : '';

      const paidDateStr = ord.paidAt ? new Date(ord.paidAt).toLocaleString('en-IN') : 'N/A';
      const verifiedByStr = ord.paymentCollectedBy
        ? `${ord.paymentCollectedBy.name} (${ord.paymentCollectedBy.role})`
        : ord.paymentStatus === 'PAID'
        ? 'Confirmed by Restaurant'
        : 'Pending Collection';

      return [
        ord.orderNumber,
        dateStr,
        timeStr,
        ord.restaurantId?.name || 'N/A',
        ord.restaurantId?.address?.city || 'N/A',
        ord.customerId?.name || ord.deliveryAddress?.recipientName || 'Customer',
        ord.customerId?.phone || ord.deliveryAddress?.phone || 'N/A',
        addr,
        itemsStr,
        totalQty,
        ord.itemSubtotal,
        ord.deliveryFee,
        ord.discount || 0,
        ord.finalAmount,
        ord.paymentMethod || 'COD',
        ord.paymentStatus || 'PENDING',
        verifiedByStr,
        paidDateStr,
        ord.orderStatus || 'PLACED',
        ord.customerNotes || '',
      ]
        .map(escapeCSV)
        .join(',');
    });

    // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 text perfectly
    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `SwadGhar_Orders_Report_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    COD Cash Monitoring overview
// @route   GET /api/admin/cod-monitor
// @access  Admin
const getCODMonitoring = async (req, res, next) => {
  try {
    const pendingCollections = await Order.find({
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'DELIVERED',
    })
      .populate('restaurantId', 'name phone')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });

    const totalPendingCash = pendingCollections.reduce((sum, o) => sum + o.finalAmount, 0);

    const recentPaidCollections = await Order.find({
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
    })
      .populate('restaurantId', 'name')
      .populate('paymentCollectedBy', 'name role')
      .sort({ paidAt: -1 })
      .limit(20);

    return sendSuccess(
      res,
      {
        totalPendingCash,
        pendingCollectionsCount: pendingCollections.length,
        pendingCollections,
        recentPaidCollections,
      },
      'COD monitoring data retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Audited payment status override by Admin
// @route   PATCH /api/admin/orders/:id/payment
// @access  Admin
const updateOrderPaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, reason } = req.body;
    if (!['PENDING', 'PAID', 'REFUNDED'].includes(paymentStatus)) {
      return sendError(res, 'Invalid payment status.', 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    const previousStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'PAID') {
      order.paidAt = new Date();
      order.paymentCollectedBy = req.user._id;
    }

    order.statusTimeline.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Payment status corrected to ${paymentStatus} by Admin. Reason: ${reason || 'Administrative adjustment'}`,
      updatedBy: req.user._id,
    });

    await order.save();

    await logAuditAction({
      performedBy: req.user._id,
      role: 'ADMIN',
      action: 'ADMIN_PAYMENT_CORRECTION',
      entityType: 'PAYMENT',
      entityId: order._id,
      previousState: { paymentStatus: previousStatus },
      newState: { paymentStatus, paidAt: order.paidAt },
      details: reason || 'Administrative payment status correction',
    });

    return sendSuccess(res, order, `Order payment status corrected to ${paymentStatus}.`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer complaints
// @route   GET /api/admin/complaints
// @access  Admin
const getComplaints = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await Complaint.find(filter)
      .populate('customerId', 'name email phone')
      .populate('restaurantId', 'name phone')
      .populate('orderId', 'orderNumber finalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    return sendSuccess(
      res,
      {
        complaints,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Complaints retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status & resolution
// @route   PATCH /api/admin/complaints/:id
// @access  Admin
const updateComplaint = async (req, res, next) => {
  try {
    const { status, resolutionNotes } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendError(res, 'Complaint not found.', 404);
    }

    if (status) complaint.status = status;
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;
    complaint.resolvedBy = req.user._id;

    await complaint.save();

    await createAndSendNotification({
      userId: complaint.customerId,
      title: `Complaint Status: ${complaint.status}`,
      message: `Your complaint has been updated: "${complaint.resolutionNotes || complaint.status}"`,
      type: 'COMPLAINT_UPDATE',
      referenceId: complaint._id,
    });

    return sendSuccess(res, complaint, 'Complaint updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
// @access  Admin
const getAuditLogs = async (req, res, next) => {
  try {
    const { entityType, action, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (entityType) filter.entityType = entityType;
    if (action) filter.action = action;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    return sendSuccess(
      res,
      {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Audit logs retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Manage categories (List, Create, Update, Delete)
// @route   POST /api/admin/categories
// @access  Admin
const createCategory = async (req, res, next) => {
  try {
    const { name, iconUrl, description, displayOrder } = req.body;
    const category = await RestaurantCategory.create({
      name,
      iconUrl,
      description,
      displayOrder: displayOrder || 0,
    });
    return sendSuccess(res, category, 'Category created.', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin directly creates & approves a new restaurant
// @route   POST /api/admin/restaurants
// @access  Admin
const createRestaurantByAdmin = async (req, res, next) => {
  try {
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
      ownerEmail,
      ownerPassword,
      ownerName,
    } = req.body;

    // 1. Find or create the restaurant owner account
    let owner = null;
    if (ownerEmail) {
      owner = await User.findOne({ email: ownerEmail });
    }

    if (!owner) {
      const emailToUse = ownerEmail || `owner_${Date.now()}@swadghar.com`;
      owner = await User.create({
        name: ownerName || `${name} Owner`,
        email: emailToUse,
        password: ownerPassword || 'OwnerPassword@123',
        phone: phone || '+919800000000',
        role: 'RESTAURANT_OWNER',
        status: 'ACTIVE',
      });
    }

    const restaurant = await Restaurant.create({
      ownerId: owner._id,
      name,
      description: description || '',
      address: {
        street: address?.street || 'Main Market Road',
        landmark: address?.landmark || '',
        city: address?.city || 'Lucknow',
        state: address?.state || 'Uttar Pradesh',
        pincode: address?.pincode || '226001',
      },
      phone: phone || '+919800000000',
      email: email || owner.email,
      cuisineType: Array.isArray(cuisineType) ? cuisineType : [cuisineType || 'North Indian'],
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500',
      coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
      openingHours: openingHours || { open: '09:00', close: '23:00' },
      estimatedPrepTimeMinutes: estimatedPrepTimeMinutes || 25,
      deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : 30,
      minimumOrderValue: minimumOrderValue !== undefined ? Number(minimumOrderValue) : 99,
      approvalStatus: 'APPROVED', // Directly approved when created by Admin
      isOpen: true,
    });

    await logAuditAction({
      performedBy: req.user._id,
      role: 'ADMIN',
      action: 'ADMIN_CREATED_RESTAURANT',
      entityType: 'RESTAURANT',
      entityId: restaurant._id,
      details: `Admin directly created and approved restaurant: ${restaurant.name}`,
    });

    return sendSuccess(res, restaurant, 'New restaurant created and approved successfully!', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getUsers,
  updateUserStatus,
  getRestaurants,
  updateRestaurantApproval,
  createRestaurantByAdmin,
  getOrders,
  exportOrdersExcel,
  getCODMonitoring,
  updateOrderPaymentStatus,
  getComplaints,
  updateComplaint,
  getAuditLogs,
  createCategory,
};
