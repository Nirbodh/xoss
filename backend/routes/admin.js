// routes/admin.js - ADMIN DASHBOARD ROUTES
const express = require('express');
const router = express.Router();
const { adminAuth, superAdminAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// ==================== ADMIN DASHBOARD ====================
// ✅ GET admin dashboard overview
router.get('/dashboard/overview', adminAuth, adminController.getDashboardOverview);

// ✅ GET system statistics
router.get('/statistics/system', adminAuth, adminController.getSystemStatistics);

// ✅ GET revenue statistics
router.get('/statistics/revenue', adminAuth, adminController.getRevenueStatistics);

// ✅ GET user statistics
router.get('/statistics/users', adminAuth, adminController.getUserStatistics);

// ==================== USER MANAGEMENT ====================
// ✅ GET all users
router.get('/users/list', adminAuth, adminController.getAllUsers);

// ✅ GET user by ID
router.get('/users/:id', adminAuth, adminController.getUserById);

// ✅ UPDATE user role
router.put('/users/:id/role', adminAuth, adminController.updateUserRole);

// ✅ UPDATE user status
router.put('/users/:id/status', adminAuth, adminController.updateUserStatus);

// ✅ UPDATE user wallet
router.put('/users/:id/wallet', adminAuth, adminController.updateUserWallet);

// ✅ SEARCH users
router.get('/users/search/:query', adminAuth, adminController.searchUsers);

// ==================== FINANCIAL MANAGEMENT ====================
// ✅ GET all withdrawals
router.get('/withdrawals/list', adminAuth, adminController.getAllWithdrawals);

// ✅ GET withdrawal statistics
router.get('/withdrawals/statistics', adminAuth, adminController.getWithdrawalStatistics);

// ✅ PROCESS withdrawal
router.post('/withdrawals/:id/process', adminAuth, adminController.processWithdrawal);

// ✅ REJECT withdrawal
router.post('/withdrawals/:id/reject', adminAuth, adminController.rejectWithdrawal);

// ✅ GET all deposits
router.get('/deposits/list', adminAuth, adminController.getAllDeposits);

// ==================== CONTENT MODERATION ====================
// ✅ GET reported content
router.get('/reports/content', adminAuth, adminController.getReportedContent);

// ✅ GET user reports
router.get('/reports/users', adminAuth, adminController.getUserReports);

// ✅ HANDLE report
router.post('/reports/:id/handle', adminAuth, adminController.handleReport);

// ==================== SYSTEM MANAGEMENT ====================
// ✅ GET system logs
router.get('/logs/system', superAdminAuth, adminController.getSystemLogs);

// ✅ GET error logs
router.get('/logs/errors', superAdminAuth, adminController.getErrorLogs);

// ✅ CLEAR cache
router.post('/cache/clear', superAdminAuth, adminController.clearCache);

// ✅ BACKUP database
router.post('/backup/create', superAdminAuth, adminController.createBackup);

// ✅ GET backup list
router.get('/backup/list', superAdminAuth, adminController.getBackupList);

// ==================== SETTINGS ====================
// ✅ GET system settings
router.get('/settings/system', superAdminAuth, adminController.getSystemSettings);

// ✅ UPDATE system settings
router.put('/settings/system', superAdminAuth, adminController.updateSystemSettings);

// ✅ GET payment settings
router.get('/settings/payment', superAdminAuth, adminController.getPaymentSettings);

// ✅ UPDATE payment settings
router.put('/settings/payment', superAdminAuth, adminController.updatePaymentSettings);

// ✅ GET email settings
router.get('/settings/email', superAdminAuth, adminController.getEmailSettings);

// ✅ UPDATE email settings
router.put('/settings/email', superAdminAuth, adminController.updateEmailSettings);

module.exports = router;
