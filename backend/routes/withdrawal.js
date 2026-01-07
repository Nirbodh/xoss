// routes/withdrawal.js - PROFESSIONAL WITHDRAWAL ROUTES
const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { auth, adminAuth } = require('../middleware/auth');

// 🔥 USER ROUTES

/**
 * @route   POST /api/withdraw/request
 * @desc    Request withdrawal
 * @access  Private
 */
router.post('/request', auth, withdrawalController.requestWithdrawal);

/**
 * @route   GET /api/withdraw/history
 * @desc    Get user withdrawal history
 * @access  Private
 */
router.get('/history', auth, withdrawalController.getUserWithdrawals);

/**
 * @route   GET /api/withdraw/stats
 * @desc    Get user withdrawal statistics
 * @access  Private
 */
router.get('/stats', auth, withdrawalController.getWithdrawalStats);

/**
 * @route   DELETE /api/withdraw/cancel/:id
 * @desc    Cancel withdrawal request
 * @access  Private
 */
router.delete('/cancel/:id', auth, withdrawalController.cancelWithdrawal);

// 🔥 ADMIN ROUTES

/**
 * @route   GET /api/withdraw/admin/analytics
 * @desc    Get withdrawal analytics
 * @access  Admin
 */
router.get('/admin/analytics', adminAuth, withdrawalController.getWithdrawalAnalytics);

/**
 * @route   GET /api/withdraw/admin/pending
 * @desc    Get pending withdrawals
 * @access  Admin
 */
router.get('/admin/pending', adminAuth, withdrawalController.getPendingWithdrawals);

/**
 * @route   GET /api/withdraw/admin/details/:id
 * @desc    Get withdrawal details
 * @access  Admin
 */
router.get('/admin/details/:id', adminAuth, withdrawalController.getWithdrawalDetails);

/**
 * @route   POST /api/withdraw/admin/approve/:id
 * @desc    Approve withdrawal
 * @access  Admin
 */
router.post('/admin/approve/:id', adminAuth, withdrawalController.approveWithdrawal);

/**
 * @route   POST /api/withdraw/admin/reject/:id
 * @desc    Reject withdrawal
 * @access  Admin
 */
router.post('/admin/reject/:id', adminAuth, withdrawalController.rejectWithdrawal);

/**
 * @route   PUT /api/withdraw/admin/status/:id
 * @desc    Update withdrawal status
 * @access  Admin
 */
router.put('/admin/status/:id', adminAuth, withdrawalController.updateWithdrawalStatus);

/**
 * @route   POST /api/withdraw/admin/bulk-update
 * @desc    Bulk update withdrawal status
 * @access  Admin
 */
router.post('/admin/bulk-update', adminAuth, withdrawalController.bulkUpdateWithdrawalStatus);

/**
 * @route   GET /api/withdraw/admin/export
 * @desc    Export withdrawals
 * @access  Admin
 */
router.get('/admin/export', adminAuth, withdrawalController.exportWithdrawals);

// 🔥 SYSTEM ROUTES

/**
 * @route   GET /api/withdraw/limits
 * @desc    Get withdrawal limits
 * @access  Public
 */
router.get('/limits', (req, res) => {
  res.json({
    success: true,
    code: 'LIMITS_FETCHED',
    message: 'Withdrawal limits fetched successfully',
    data: {
      min_withdrawal: 100,
      max_withdrawal: 50000,
      daily_max_withdrawals: 5,
      processing_time: '24-48 hours',
      available_methods: ['bkash', 'nagad', 'rocket', 'bank'],
      fees: {
        bkash: '0% (Free)',
        nagad: '0% (Free)',
        rocket: '0% (Free)',
        bank: '15 BDT per transaction'
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/withdraw/methods
 * @desc    Get available payment methods
 * @access  Public
 */
router.get('/methods', (req, res) => {
  res.json({
    success: true,
    code: 'METHODS_FETCHED',
    message: 'Payment methods fetched successfully',
    data: {
      methods: [
        {
          id: 'bkash',
          name: 'bKash',
          logo: '/images/bkash.png',
          min_amount: 100,
          max_amount: 50000,
          processing_time: '24 hours',
          instructions: 'Send money to your bKash account',
          account_details_required: ['phone'],
          verification_required: true
        },
        {
          id: 'nagad',
          name: 'Nagad',
          logo: '/images/nagad.png',
          min_amount: 100,
          max_amount: 50000,
          processing_time: '24 hours',
          instructions: 'Send money to your Nagad account',
          account_details_required: ['phone'],
          verification_required: true
        },
        {
          id: 'rocket',
          name: 'Rocket',
          logo: '/images/rocket.png',
          min_amount: 100,
          max_amount: 50000,
          processing_time: '24 hours',
          instructions: 'Send money to your Rocket account',
          account_details_required: ['phone'],
          verification_required: true
        },
        {
          id: 'bank',
          name: 'Bank Transfer',
          logo: '/images/bank.png',
          min_amount: 1000,
          max_amount: 50000,
          processing_time: '48 hours',
          instructions: 'Transfer to your bank account',
          account_details_required: ['account_number', 'account_name', 'bank_name', 'branch'],
          verification_required: true,
          fee: 15
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
