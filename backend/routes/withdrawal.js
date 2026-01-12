// routes/withdrawal.js - CORRECTED HYBRID VERSION (Logo paths fixed)
const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { auth, adminAuth, moderatorAuth, supportAuth } = require('../middleware/auth');

// 🔥 PUBLIC ROUTES

/**
 * @route   GET /api/withdraw/limits
 * @desc    Get withdrawal limits and fees
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
      daily_max_count: 5,
      daily_max_amount: 100000,
      processing_time: {
        manual: '24-48 hours',
        auto: 'Instant (1-5 minutes)',
        bank: '24-72 hours'
      },
      available_methods: ['bkash', 'nagad', 'rocket', 'bank'],
      withdrawal_types: ['manual', 'auto'],
      fees: {
        bkash: '0% (Free)',
        nagad: '0% (Free)',
        rocket: '0% (Free)',
        bank: '15 BDT per transaction'
      },
      cancellation_policy: {
        allowed: true,
        time_limit: '1 hour',
        fee: '0% (Free)'
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
          type: 'mobile_banking',
          min_amount: 100,
          max_amount: 50000,
          processing_time: '24 hours',
          withdrawal_type: ['manual', 'auto'],
          instructions: 'Send money to your bKash account',
          account_details_required: ['phone'],
          verification_required: true,
          fee: '0%',
          supported: true
        },
        {
          id: 'nagad',
          name: 'Nagad',
          logo: '/images/nagad.png',
          type: 'mobile_banking',
          min_amount: 100,
          max_amount: 50000,
          processing_time: '24 hours',
          withdrawal_type: ['manual', 'auto'],
          instructions: 'Send money to your Nagad account',
          account_details_required: ['phone'],
          verification_required: true,
          fee: '0%',
          supported: true
        },
        {
          id: 'rocket',
          name: 'Rocket',
          logo: '/images/rocket.png',
          type: 'mobile_banking',
          min_amount: 100,
          max_amount: 50000,
          processing_time: '24 hours',
          withdrawal_type: ['manual'],
          instructions: 'Send money to your Rocket account',
          account_details_required: ['phone'],
          verification_required: true,
          fee: '0%',
          supported: true
        },
        {
          id: 'bank',
          name: 'Bank Transfer',
          logo: '/images/bank.png', // ✅ CORRECTED: Original path restored
          type: 'bank_transfer',
          min_amount: 1000,
          max_amount: 50000,
          processing_time: '48-72 hours',
          withdrawal_type: ['manual'],
          instructions: 'Transfer to your bank account',
          account_details_required: ['account_number', 'account_name', 'bank_name', 'branch'],
          verification_required: true,
          fee: '15 BDT',
          additional_info: 'Processing time may vary based on bank'
        }
      ],
      summary: {
        total_methods: 4,
        mobile_banking: 3,
        bank_transfer: 1,
        auto_supported: 2
      }
    },
    timestamp: new Date().toISOString()
  });
});

// 🔥 USER ROUTES (AUTH REQUIRED)

/**
 * @route   POST /api/withdraw/request
 * @desc    Request withdrawal (Manual or Auto)
 * @access  Private
 */
router.post('/request', auth, withdrawalController.requestWithdrawal);

/**
 * @route   GET /api/withdraw/history
 * @desc    Get user withdrawal history with filtering
 * @access  Private
 */
router.get('/history', auth, withdrawalController.getUserWithdrawals);

/**
 * @route   GET /api/withdraw/stats
 * @desc    Get comprehensive user withdrawal statistics
 * @access  Private
 */
router.get('/stats', auth, withdrawalController.getWithdrawalStats);

/**
 * @route   DELETE /api/withdraw/cancel/:id
 * @desc    Cancel withdrawal request (within 1 hour)
 * @access  Private
 */
router.delete('/cancel/:id', auth, withdrawalController.cancelWithdrawal);

/**
 * @route   GET /api/withdraw/:withdrawal_number
 * @desc    Get withdrawal details by withdrawal number
 * @access  Private
 */
router.get('/:withdrawal_number', auth, withdrawalController.getWithdrawalByNumber);

// 🔥 ADMIN ROUTES (ADMIN AUTH REQUIRED)

/**
 * @route   GET /api/withdraw/admin/analytics
 * @desc    Get comprehensive withdrawal analytics
 * @access  Admin/Moderator
 */
router.get('/admin/analytics', moderatorAuth, withdrawalController.getWithdrawalAnalytics);

/**
 * @route   GET /api/withdraw/admin/pending
 * @desc    Get pending withdrawals with search/filter
 * @access  Admin/Moderator/Support
 */
router.get('/admin/pending', supportAuth, withdrawalController.getPendingWithdrawals);

/**
 * @route   GET /api/withdraw/admin/details/:id
 * @desc    Get detailed withdrawal information
 * @access  Admin/Moderator/Support
 */
router.get('/admin/details/:id', supportAuth, withdrawalController.getWithdrawalDetails);

/**
 * @route   POST /api/withdraw/admin/approve/:id
 * @desc    Approve withdrawal request
 * @access  Admin/Moderator
 */
router.post('/admin/approve/:id', moderatorAuth, withdrawalController.approveWithdrawal);

/**
 * @route   POST /api/withdraw/admin/reject/:id
 * @desc    Reject withdrawal request with refund
 * @access  Admin/Moderator
 */
router.post('/admin/reject/:id', moderatorAuth, withdrawalController.rejectWithdrawal);

/**
 * @route   PUT /api/withdraw/admin/status/:id
 * @desc    Update withdrawal status with validation
 * @access  Admin/Moderator
 */
router.put('/admin/status/:id', moderatorAuth, withdrawalController.updateWithdrawalStatus);

/**
 * @route   POST /api/withdraw/admin/bulk-update
 * @desc    Bulk update withdrawal status (Admin only)
 * @access  Admin
 */
router.post('/admin/bulk-update', adminAuth, withdrawalController.bulkUpdateWithdrawalStatus);

/**
 * @route   GET /api/withdraw/admin/export
 * @desc    Export withdrawals to CSV/JSON
 * @access  Admin/Moderator
 */
router.get('/admin/export', moderatorAuth, withdrawalController.exportWithdrawals);

module.exports = router;
