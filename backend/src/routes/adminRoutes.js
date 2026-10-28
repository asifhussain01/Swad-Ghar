const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const adminAuth = [authenticate, authorize('ADMIN')];

// Dashboard & KPI Analytics
router.get('/dashboard', adminAuth, adminController.getDashboardMetrics);

// Users Management
router.get('/users', adminAuth, adminController.getUsers);
router.patch('/users/:id/status', adminAuth, adminController.updateUserStatus);

// Restaurants Management & Approvals
router.get('/restaurants', adminAuth, adminController.getRestaurants);
router.post('/restaurants', adminAuth, adminController.createRestaurantByAdmin);
router.patch('/restaurants/:id/approval', adminAuth, adminController.updateRestaurantApproval);

// Orders & COD Payment Monitoring
router.get('/orders', adminAuth, adminController.getOrders);
router.get('/orders/export-excel', adminAuth, adminController.exportOrdersExcel);
router.get('/cod-monitor', adminAuth, adminController.getCODMonitoring);
router.patch('/orders/:id/payment', adminAuth, adminController.updateOrderPaymentStatus);

// Complaints & Dispute Resolution
router.get('/complaints', adminAuth, adminController.getComplaints);
router.patch('/complaints/:id', adminAuth, adminController.updateComplaint);

// Audit Trail
router.get('/audit-logs', adminAuth, adminController.getAuditLogs);

// Categories
router.post('/categories', adminAuth, adminController.createCategory);

module.exports = router;
