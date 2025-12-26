// routes/withdrawal.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { auth, adminAuth } = require('../middleware/auth');

// =============================
// 🔹 USER WITHDRAWAL ROUTES
// =============================

// ✅ User: Request withdrawal
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

// ✅ Admin: Approve withdrawal
router.post('/admin/approve/:id', adminAuth, withdrawalController.approveWithdrawal);

// ✅ Admin: Reject withdrawal
router.post('/admin/reject/:id', adminAuth, withdrawalController.rejectWithdrawal);

// =============================
// 🔹 TEST ROUTES (DEVELOPMENT ONLY)
// =============================

// ✅ Test withdrawal endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Withdrawal API is working!',
    endpoints: {
      user: {
        'POST /request': 'Request withdrawal',
        'GET /history': 'Get withdrawal history',
        'GET /stats': 'Get withdrawal stats'
      },
      admin: {
        'GET /admin/pending': 'Get pending withdrawals',
        'GET /admin/analytics': 'Get withdrawal analytics',
        'POST /admin/approve/:id': 'Approve withdrawal',
        'POST /admin/reject/:id': 'Reject withdrawal'
      }
    }
  });
});

module.exports = router;
