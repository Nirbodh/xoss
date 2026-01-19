// routes/payments.js - COMPLETE PAYMENT ROUTES
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');

// ✅ GET PAYMENT METHODS
router.get('/methods', (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'bkash',
        name: 'bKash',
        type: 'mobile',
        logo: '/images/bkash.png',
        min_amount: 100,
        max_amount: 50000,
        fee_percentage: 1.85,
        fixed_fee: 5,
        processing_time: 'Instant',
        instructions: [
          'Go to your bKash app',
          'Select "Send Money"',
          'Enter Merchant Number: 017XXXXXXXX',
          'Enter the exact amount',
          'Enter reference: XOSS Payment',
          'Complete the transaction'
        ],
        supported_banks: ['All Bangladeshi banks'],
        verification_required: true
      },
      {
        id: 'nagad',
        name: 'Nagad',
        type: 'mobile',
        logo: '/images/nagad.png',
        min_amount: 100,
        max_amount: 50000,
        fee_percentage: 1.85,
        fixed_fee: 5,
        processing_time: 'Instant',
        instructions: [
          'Go to your Nagad app',
          'Select "Send Money"',
          'Enter Merchant Number: 017XXXXXXXX',
          'Enter the exact amount',
          'Enter reference: XOSS Payment',
          'Complete the transaction'
        ],
        supported_banks: ['All Bangladeshi banks'],
        verification_required: true
      },
      {
        id: 'rocket',
        name: 'Rocket (DBBL Mobile Banking)',
        type: 'mobile',
        logo: '/images/rocket.png',
        min_amount: 100,
        max_amount: 50000,
        fee_percentage: 1.85,
        fixed_fee: 5,
        processing_time: 'Instant',
        instructions: [
          'Go to your Rocket app',
          'Select "Send Money"',
          'Enter Merchant Number: 017XXXXXXXX',
          'Enter the exact amount',
          'Enter reference: XOSS Payment',
          'Complete the transaction'
        ],
        supported_banks: ['Dutch-Bangla Bank'],
        verification_required: true
      },
      {
        id: 'bank',
        name: 'Bank Transfer',
        type: 'bank',
        logo: '/images/bank.png',
        min_amount: 1000,
        max_amount: 100000,
        fee_percentage: 0,
        fixed_fee: 15,
        processing_time: '1-2 business days',
        instructions: [
          'Go to your bank app or branch',
          'Transfer to our bank account',
          'Account Name: XOSS Gaming Ltd.',
          'Account Number: 123456789',
          'Bank: Prime Bank Limited',
          'Branch: Gulshan Branch, Dhaka',
          'Include your username in reference'
        ],
        supported_banks: [
          'Prime Bank',
          'Dutch-Bangla Bank',
          'BRAC Bank',
          'City Bank',
          'Eastern Bank'
        ],
        verification_required: true,
        account_details_required: true
      }
    ];

    res.json({
      success: true,
      message: 'Payment methods retrieved successfully',
      data: paymentMethods,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment methods'
    });
  }
});

// ✅ INITIATE PAYMENT
router.post('/initiate', auth, async (req, res) => {
  try {
    const { amount, method, payment_details } = req.body;
    const userId = req.user.id;

    // Validation
    if (!amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment method are required'
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Check minimum amount based on method
    const methodConfigs = {
      bkash: { min: 100, max: 50000 },
      nagad: { min: 100, max: 50000 },
      rocket: { min: 100, max: 50000 },
      bank: { min: 1000, max: 100000 }
    };

    const config = methodConfigs[method];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    if (numericAmount < config.min || numericAmount > config.max) {
      return res.status(400).json({
        success: false,
        message: `Amount must be between ${config.min} and ${config.max} for ${method}`
      });
    }

    // Generate unique transaction ID
    const transactionId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = new Payment({
      user: userId,
      transaction_id: transactionId,
      amount: numericAmount,
      payment_method: method,
      payment_details: payment_details || {},
      metadata: {
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        device_info: req.headers['device-info'] || 'Unknown'
      }
    });

    await payment.save();

    // Generate payment response based on method
    let paymentResponse = {
      transaction_id: transactionId,
      amount: numericAmount,
      method: method,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    // Add method-specific instructions
    if (['bkash', 'nagad', 'rocket'].includes(method)) {
      paymentResponse.instructions = {
        step1: `Send ${numericAmount} BDT to our ${method} number`,
        step2: 'Merchant Number: 017XXXXXXXX',
        step3: 'Reference: XOSS Payment',
        step4: 'After sending, verify your payment using the verify endpoint'
      };
      paymentResponse.merchant_number = '017XXXXXXXX';
    } else if (method === 'bank') {
      paymentResponse.instructions = {
        step1: 'Transfer to our bank account',
        step2: 'Bank: Prime Bank Limited',
        step3: 'Account: XOSS Gaming Ltd.',
        step4: 'Account No: 123456789',
        step5: 'Include transaction ID in reference'
      };
      paymentResponse.bank_details = {
        bank_name: 'Prime Bank Limited',
        account_name: 'XOSS Gaming Ltd.',
        account_number: '123456789',
        branch: 'Gulshan Branch, Dhaka',
        routing_number: '123456789'
      };
    }

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: paymentResponse
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
});

// ✅ VERIFY PAYMENT
router.post('/verify/:transaction_id', auth, async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const { verification_code, transaction_number } = req.body;
    const userId = req.user.id;

    // Find payment
    const payment = await Payment.findOne({
      transaction_id,
      user: userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: payment
      });
    }

    // In a real app, you would verify with payment gateway here
    // For now, simulate verification
    const isVerified = true; // Simulated verification

    if (isVerified) {
      // Update payment status
      payment.status = 'completed';
      payment.processed_at = new Date();
      payment.completed_at = new Date();
      payment.payment_details.transaction_number = transaction_number;
      payment.gateway_response = {
        verified: true,
        verification_code: verification_code,
        verified_at: new Date().toISOString()
      };

      await payment.save();

      // Update user wallet
      let wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        wallet = new Wallet({
          user: userId,
          balance: payment.fees.net_amount
        });
      } else {
        wallet.balance += payment.fees.net_amount;
      }
      await wallet.save();

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: 'deposit',
        amount: payment.amount,
        status: 'completed',
        description: `Deposit via ${payment.payment_method}`,
        reference_id: transaction_id,
        metadata: {
          payment_id: payment._id,
          payment_method: payment.payment_method,
          net_amount: payment.fees.net_amount,
          fees: payment.fees
        }
      });
      await transaction.save();

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          payment: payment,
          wallet_balance: wallet.balance,
          transaction: transaction
        }
      });
    } else {
      payment.status = 'failed';
      payment.notes = 'Verification failed';
      await payment.save();

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// ✅ GET PAYMENT STATUS
router.get('/status/:transaction_id', auth, async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({
      transaction_id,
      user: userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
});

// ✅ GET USER PAYMENT HISTORY
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, method } = req.query;

    const query = { user: userId };
    if (status) query.status = status;
    if (method) query.payment_method = method;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-gateway_response -metadata -__v');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
});

// ✅ GET PAYMENT STATISTICS
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Payment.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total_payments: { $sum: 1 },
          total_amount: { $sum: '$amount' },
          completed_payments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pending_payments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failed_payments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          by_method: {
            $push: {
              method: '$payment_method',
              amount: '$amount',
              status: '$status'
            }
          }
        }
      },
      {
        $project: {
          total_payments: 1,
          total_amount: 1,
          completed_payments: 1,
          pending_payments: 1,
          failed_payments: 1,
          success_rate: {
            $cond: [
              { $eq: ['$total_payments', 0] },
              0,
              { $divide: ['$completed_payments', '$total_payments'] }
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        total_payments: 0,
        total_amount: 0,
        completed_payments: 0,
        pending_payments: 0,
        failed_payments: 0,
        success_rate: 0
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment statistics'
    });
  }
});

// ✅ ADMIN ROUTES

// GET ALL PAYMENTS (ADMIN)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;
    if (method) query.payment_method = method;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
});

// GET PAYMENT DETAILS (ADMIN)
router.get('/admin/details/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('user', 'name email phone createdAt')
      .populate({
        path: 'user',
        populate: {
          path: 'wallet',
          select: 'balance'
        }
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Admin get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment details'
    });
  }
});

// UPDATE PAYMENT STATUS (ADMIN)
router.put('/admin/status/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.status = status;
    if (notes) payment.notes = notes;
    
    if (status === 'completed') {
      payment.completed_at = new Date();
    } else if (status === 'refunded') {
      payment.refunded_at = new Date();
    }

    await payment.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Admin update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
});

// GET ADMIN PAYMENT STATISTICS
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await Payment.getPaymentStats();

    // Get daily statistics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Payment.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          total_amount: { $sum: '$amount' },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats,
        daily_stats: dailyStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Admin get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment statistics'
    });
  }
});

module.exports = router;
