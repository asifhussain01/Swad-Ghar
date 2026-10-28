const Complaint = require('../models/Complaint');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { notifyAdminChannel } = require('../services/notificationService');

// @desc    File a customer complaint regarding an order
// @route   POST /api/customer/complaints
// @access  Customer
const fileComplaint = async (req, res, next) => {
  try {
    const { orderId, subject, description } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      customerId: req.user._id,
    });

    if (!order) {
      return sendError(res, 'Order not found or unauthorized.', 404);
    }

    const complaint = await Complaint.create({
      orderId: order._id,
      customerId: req.user._id,
      restaurantId: order.restaurantId,
      subject,
      description,
    });

    notifyAdminChannel('admin_new_complaint', {
      complaintId: complaint._id,
      orderNumber: order.orderNumber,
      subject: complaint.subject,
      customer: req.user.name,
    });

    return sendSuccess(res, complaint, 'Complaint submitted. Our support team will investigate.', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in customer's complaints
// @route   GET /api/customer/complaints
// @access  Customer
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ customerId: req.user._id })
      .populate('orderId', 'orderNumber finalAmount')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 });

    return sendSuccess(res, complaints, 'Complaints retrieved.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  fileComplaint,
  getMyComplaints,
};
