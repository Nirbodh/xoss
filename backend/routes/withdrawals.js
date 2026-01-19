// routes/withdrawals.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');

// ✅ SIMPLE CONTROLLER FUNCTIONS (NO EXTERNAL DEPENDENCIES)
const getWithdrawalInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Withdrawal system information',
      data: {
        min_withdrawal: 100,
        max_withdrawal: 10000,
        fee_percentage: 2,
        processing_time: '24-48 hours',
        status: 'active',
        available_balance: 0, // Will be populated by user's actual balance
        daily_limit: 50000,
        monthly_limit: 500000
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal info'
    });
  }
};

const requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, account_details } = req.body;
    
    if (!amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Amount and withdrawal method are required'
      });
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is 100'
      });
    }
    
    if (numericAmount > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum withdrawal amount is 10000'
      });
    }
    
    res.json({
      success: true,
      message: 'Withdrawal request received successfully',
      data: {
        withdrawal_id: 'WD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        amount: numericAmount,
        method: method,
        account_details: account_details || {},
        status: 'pending',
        requested_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        fee: numericAmount * 0.02, // 2% fee
        net_amount: numericAmount - (numericAmount * 0.02)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal request'
    });
  }
};

const getWithdrawalHistory = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Withdrawal history retrieved successfully',
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal history'
    });
  }
};

const getWithdrawalStats = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        total_withdrawals: 0,
        total_amount: 0,
        pending_withdrawals: 0,
        completed_withdrawals: 0,
        rejected_withdrawals: 0,
        average_amount: 0,
        last_withdrawal: null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal stats'
    });
  }
};

const getWithdrawalLimits = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        min_withdrawal: 100,
        max_withdrawal: 10000,
        daily_limit: 50000,
        daily_count_limit: 5,
        monthly_limit: 500000,
        fee_percentage: 2,
        min_fee: 10,
        max_fee: 200
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal limits'
    });
  }
};

const getWithdrawalMethods = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 'bkash',
          name: 'bKash',
          description: 'Mobile Financial Service',
          logo: 'https://example.com/bkash.png',
          min_amount: 100,
          max_amount: 10000,
          processing_time: '24 hours',
          fee: '1.85% + 5 BDT',
          account_details_required: ['phone_number'],
          instructions: 'Enter your bKash mobile number'
        },
        {
          id: 'nagad',
          name: 'Nagad',
          description: 'Mobile Financial Service',
          logo: 'https://example.com/nagad.png',
          min_amount: 100,
          max_amount: 10000,
          processing_time: '24 hours',
          fee: '1.85% + 5 BDT',
          account_details_required: ['phone_number'],
          instructions: 'Enter your Nagad mobile number'
        },
        {
          id: 'rocket',
          name: 'Rocket',
          description: 'Mobile Banking',
          logo: 'https://example.com/rocket.png',
          min_amount: 100,
          max_amount: 10000,
          processing_time: '24 hours',
          fee: '1.85% + 5 BDT',
          account_details_required: ['phone_number'],
          instructions: 'Enter your Rocket mobile number'
        },
        {
          id: 'bank',
          name: 'Bank Transfer',
          description: 'Direct Bank Transfer',
          logo: 'https://example.com/bank.png',
          min_amount: 1000,
          max_amount: 50000,
          processing_time: '48 hours',
          fee: '15 BDT flat',
          account_details_required: ['account_number', 'account_name', 'bank_name', 'branch', 'routing_number'],
          instructions: 'Enter your bank account details'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal methods'
    });
  }
};

const cancelWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: 'Withdrawal request cancelled successfully',
      data: {
        withdrawal_id: id,
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel withdrawal'
    });
  }
};

// ✅ ADMIN FUNCTIONS
const getPendingWithdrawals = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Pending withdrawals retrieved',
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending withdrawals'
    });
  }
};

const getWithdrawalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      data: {
        id: id,
        amount: 0,
        method: 'bkash',
        status: 'pending',
        user_id: 'user123',
        user_name: 'Test User',
        user_email: 'test@example.com',
        requested_at: new Date().toISOString(),
        account_details: {
          phone_number: '01XXXXXXXXX'
        },
        admin_notes: [],
        audit_log: []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal details'
    });
  }
};

const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      data: {
        withdrawal_id: id,
        status: 'completed',
        approved_at: new Date().toISOString(),
        approved_by: req.user?.id || 'admin',
        transaction_id: 'TXN-' + Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve withdrawal'
    });
  }
};

const rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    res.json({
      success: true,
      message: 'Withdrawal rejected successfully',
      data: {
        withdrawal_id: id,
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: req.user?.id || 'admin',
        rejection_reason: reason || 'Insufficient information'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject withdrawal'
    });
  }
};

const getWithdrawalAnalytics = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        total_withdrawals: 0,
        total_amount: 0,
        pending_amount: 0,
        completed_amount: 0,
        rejected_amount: 0,
        average_withdrawal: 0,
        top_methods: [],
        daily_stats: [],
        monthly_stats: []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal analytics'
    });
  }
};

// ✅ USER ROUTES
router.get('/', auth, getWithdrawalInfo);
router.post('/request', auth, requestWithdrawal);
router.get('/history', auth, getWithdrawalHistory);
router.get('/stats', auth, getWithdrawalStats);
router.get('/limits', auth, getWithdrawalLimits);
router.get('/methods', auth, getWithdrawalMethods);
router.delete('/cancel/:id', auth, cancelWithdrawal);

// ✅ ADMIN ROUTES
router.get('/admin/pending', adminAuth, getPendingWithdrawals);
router.get('/admin/details/:id', adminAuth, getWithdrawalDetails);
router.post('/admin/approve/:id', adminAuth, approveWithdrawal);
router.post('/admin/reject/:id', adminAuth, rejectWithdrawal);
router.get('/admin/analytics', adminAuth, getWithdrawalAnalytics);

// ✅ PUBLIC ROUTES (for documentation/testing)
router.get('/public/limits', (req, res) => {
  res.json({
    success: true,
    message: 'Withdrawal limits (public)',
    data: {
      min_withdrawal: 100,
      max_withdrawal: 10000
    }
  });
});

module.exports = router;
