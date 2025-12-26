// routes/withdrawal.js - COMPLETE WITHDRAWAL ROUTES
const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { auth, adminAuth } = require('../middleware/auth');

// =============================
// 🔹 USER WITHDRAWAL ROUTES
// =============================

// ✅ User: Request withdrawal (manual or auto)
router.post('/request', auth, withdrawalController.requestWithdrawal);

// ✅ User: Get withdrawal history
router.get('/history', auth, withdrawalController.getUserWithdrawals);

// ✅ User: Get withdrawal stats
router.get('/stats', auth, withdrawalController.getWithdrawalStats);

// =============================
// 🔹 ADMIN WITHDRAWAL ROUTES
// =============================

// ✅ Admin: Get pending withdrawals
router.get('/admin/pending', adminAuth, withdrawalController.getPendingWithdrawals);

// ✅ Admin: Get withdrawal analytics
router.get('/admin/analytics', adminAuth, withdrawalController.getWithdrawalAnalytics);

// ✅ Admin: Get all withdrawals (for history)
router.get('/admin/all', adminAuth, withdrawalController.getAdminWithdrawals);

// ✅ Admin: Approve withdrawal (manual)
router.post('/admin/approve/:id', adminAuth, withdrawalController.approveWithdrawal);

// ✅ Admin: Reject withdrawal
router.post('/admin/reject/:id', adminAuth, withdrawalController.rejectWithdrawal);

// ✅ Admin: Process auto withdrawals (for future)
router.post('/admin/process-auto', adminAuth, withdrawalController.processAutoWithdrawals);

// ✅ Admin: Toggle auto withdrawal system
router.post('/admin/toggle-auto', adminAuth, withdrawalController.toggleAutoWithdrawal);

// =============================
// 🔹 TEST & HEALTH CHECK ROUTES
// =============================

// ✅ Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Withdrawal API is healthy 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ✅ Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Withdrawal API is working perfectly!',
    system: {
      mode: 'MANUAL_WITHDRAWAL',
      auto_withdrawal: 'DISABLED',
      features: ['manual_withdrawal', 'admin_approval', 'user_history', 'analytics']
    },
    endpoints: {
      user: {
        'POST /request': 'Request withdrawal',
        'GET /history': 'Get withdrawal history',
        'GET /stats': 'Get withdrawal stats'
      },
      admin: {
        'GET /admin/pending': 'Get pending withdrawals',
        'GET /admin/analytics': 'Get withdrawal analytics',
        'GET /admin/all': 'Get all withdrawals',
        'POST /admin/approve/:id': 'Approve withdrawal',
        'POST /admin/reject/:id': 'Reject withdrawal',
        'POST /admin/process-auto': 'Process auto withdrawals',
        'POST /admin/toggle-auto': 'Toggle auto system'
      }
    }
  });
});

module.exports = router;
