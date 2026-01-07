// routes/wallet.js - PROFESSIONAL WALLET ROUTES
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { Wallet, Transaction } = require('../models/Wallet');
const User = require('../models/User');

// 🔥 HELPER FUNCTIONS
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(amount);
};

const validateAmount = (amount) => {
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('Valid positive amount is required');
  }
  return Number(amount);
};

// 🔥 WALLET ROUTES

/**
 * @route   GET /api/wallet
 * @desc    Get wallet balance and info
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`💰 Fetching wallet for user: ${userId}`);
    
    // 🔥 GET WALLET AND USER IN PARALLEL
    const [wallet, user] = await Promise.all([
      Wallet.findOrCreate(userId),
      User.findById(userId).select('username email wallet_balance total_earnings')
    ]);
    
    // 🔥 ENSURE SYNC BETWEEN WALLET AND USER
    if (Math.abs(wallet.balance - (user?.wallet_balance || 0)) > 0.01) {
      console.warn(`⚠️ Balance mismatch detected for user ${userId}: Wallet=${wallet.balance}, User=${user?.wallet_balance}`);
      
      // 🔥 SYNC THEM
      await User.findByIdAndUpdate(userId, {
        wallet_balance: wallet.balance,
        total_earnings: wallet.total_earned
      });
      
      console.log(`✅ Balance synced for user ${userId}: ${wallet.balance}`);
      
      // 🔥 REFETCH USER
      user.wallet_balance = wallet.balance;
      user.total_earnings = wallet.total_earned;
    }
    
    // 🔥 GET WALLET SUMMARY
    const summary = await Wallet.getSummary(userId);
    
    res.json({
      success: true,
      code: 'WALLET_FETCHED',
      message: 'Wallet fetched successfully',
      data: {
        user: {
          id: user?._id,
          username: user?.username,
          email: user?.email,
          wallet_balance: wallet.balance,
          formatted_balance: formatCurrency(wallet.balance),
          total_earnings: wallet.total_earned,
          formatted_total_earnings: formatCurrency(wallet.total_earned)
        },
        wallet: summary.wallet,
        stats: summary.stats,
        limits: summary.limits,
        recent_transactions: summary.recent_transactions,
        last_activity: wallet.last_activity
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get wallet error:', error);
    res.status(500).json({
      success: false,
      code: 'WALLET_FETCH_ERROR',
      message: 'Failed to fetch wallet',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get wallet transactions with pagination
 * @access  Private
 */
router.get('/transactions', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 20, 
      type = null, 
      status = null,
      start_date = null,
      end_date = null,
      sort_by = '-createdAt'
    } = req.query;
    
    const wallet = await Wallet.findOrCreate(userId);
    const transactionHistory = await wallet.getTransactionHistory({
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      status,
      startDate: start_date,
      endDate: end_date,
      sortBy: sort_by
    });
    
    // 🔥 FORMAT TRANSACTIONS
    const formattedTransactions = transactionHistory.transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      formatted_amount: formatCurrency(tx.amount),
      description: tx.description,
      status: tx.status,
      payment_method: tx.payment_method,
      reference_id: tx.reference_id,
      transaction_id: tx.transaction_id,
      created_at: tx.createdAt,
      formatted_created_at: tx.createdAt.toISOString(),
      metadata: tx.metadata
    }));
    
    res.json({
      success: true,
      code: 'TRANSACTIONS_FETCHED',
      message: 'Transactions fetched successfully',
      data: {
        transactions: formattedTransactions,
        pagination: transactionHistory.pagination,
        filters: {
          type,
          status,
          start_date,
          end_date,
          sort_by
        },
        summary: {
          total_transactions: transactionHistory.pagination.total,
          credit_total: formattedTransactions
            .filter(t => t.type.includes('credit') || t.type.includes('deposit') || t.type.includes('win') || t.type.includes('bonus'))
            .reduce((sum, t) => sum + t.amount, 0),
          debit_total: formattedTransactions
            .filter(t => t.type.includes('debit') || t.type.includes('withdrawal') || t.type.includes('entry'))
            .reduce((sum, t) => sum + t.amount, 0)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({
      success: false,
      code: 'TRANSACTIONS_ERROR',
      message: 'Failed to fetch transactions',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   POST /api/wallet/credit
 * @desc    Credit wallet (add money)
 * @access  Private/Admin
 */
router.post('/credit', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      amount, 
      description = '', 
      metadata = {},
      transaction_type = 'credit'
    } = req.body;
    
    // 🔥 VALIDATE AMOUNT
    const parsedAmount = validateAmount(amount);
    
    console.log(`💰 Crediting wallet for user: ${userId}, Amount: ${parsedAmount}, Type: ${transaction_type}`);
    
    const wallet = await Wallet.findOrCreate(userId);
    
    // 🔥 CHECK IF USER HAS PERMISSION
    const user = await User.findById(userId);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
    
    // 🔥 ONLY ALLOW ADMIN FOR CERTAIN TRANSACTION TYPES
    const adminOnlyTypes = ['admin_credit', 'adjustment', 'manual_credit'];
    if (adminOnlyTypes.includes(transaction_type) && !isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin permission required for this transaction type'
      });
    }
    
    // 🔥 ADD METADATA
    const enhancedMetadata = {
      ...metadata,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      processed_by: req.user.userId,
      user_role: req.user.role,
      transaction_source: 'manual'
    };
    
    const result = await wallet.credit(parsedAmount, {
      type: transaction_type,
      description: description || `Wallet credit - ${transaction_type}`,
      metadata: enhancedMetadata
    });
    
    // 🔥 GET UPDATED USER DATA
    const updatedUser = await User.findById(userId).select('wallet_balance username');
    
    res.json({
      success: true,
      code: 'WALLET_CREDITED',
      message: 'Wallet credited successfully',
      data: {
        transaction: {
          id: result.transaction._id,
          transaction_id: result.transaction.transaction_id,
          type: result.transaction.type,
          amount: result.transaction.amount,
          formatted_amount: formatCurrency(result.transaction.amount),
          description: result.transaction.description,
          status: result.transaction.status,
          created_at: result.transaction.createdAt
        },
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          wallet_balance: updatedUser.wallet_balance,
          formatted_balance: formatCurrency(updatedUser.wallet_balance)
        },
        wallet: {
          balance: result.wallet.balance,
          available_balance: result.wallet.available_balance,
          total_earned: result.wallet.total_earned,
          formatted_balance: formatCurrency(result.wallet.balance)
        },
        summary: {
          previous_balance: updatedUser.wallet_balance - parsedAmount,
          new_balance: updatedUser.wallet_balance,
          change: parsedAmount
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Credit wallet error:', error);
    res.status(500).json({
      success: false,
      code: 'CREDIT_ERROR',
      message: 'Failed to credit wallet',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/wallet/debit
 * @desc    Debit wallet (remove money)
 * @access  Private/Admin
 */
router.post('/debit', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      amount, 
      description = '', 
      metadata = {},
      transaction_type = 'debit'
    } = req.body;
    
    // 🔥 VALIDATE AMOUNT
    const parsedAmount = validateAmount(amount);
    
    console.log(`💰 Debiting wallet for user: ${userId}, Amount: ${parsedAmount}, Type: ${transaction_type}`);
    
    const wallet = await Wallet.findOrCreate(userId);
    
    // 🔥 CHECK IF USER HAS PERMISSION
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
    
    // 🔥 ONLY ALLOW ADMIN FOR CERTAIN TRANSACTION TYPES
    const adminOnlyTypes = ['admin_debit', 'penalty', 'manual_debit'];
    if (adminOnlyTypes.includes(transaction_type) && !isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin permission required for this transaction type'
      });
    }
    
    // 🔥 CHECK BALANCE
    if (wallet.available_balance < parsedAmount) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient available balance',
        available_balance: wallet.available_balance,
        formatted_available_balance: formatCurrency(wallet.available_balance),
        requested_amount: parsedAmount
      });
    }
    
    // 🔥 ADD METADATA
    const enhancedMetadata = {
      ...metadata,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      processed_by: req.user.userId,
      user_role: req.user.role,
      transaction_source: 'manual'
    };
    
    const result = await wallet.debit(parsedAmount, {
      type: transaction_type,
      description: description || `Wallet debit - ${transaction_type}`,
      metadata: enhancedMetadata
    });
    
    // 🔥 GET UPDATED USER DATA
    const updatedUser = await User.findById(userId).select('wallet_balance username');
    
    res.json({
      success: true,
      code: 'WALLET_DEBITED',
      message: 'Wallet debited successfully',
      data: {
        transaction: {
          id: result.transaction._id,
          transaction_id: result.transaction.transaction_id,
          type: result.transaction.type,
          amount: result.transaction.amount,
          formatted_amount: formatCurrency(result.transaction.amount),
          description: result.transaction.description,
          status: result.transaction.status,
          created_at: result.transaction.createdAt
        },
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          wallet_balance: updatedUser.wallet_balance,
          formatted_balance: formatCurrency(updatedUser.wallet_balance)
        },
        wallet: {
          balance: result.wallet.balance,
          available_balance: result.wallet.available_balance,
          total_spent: result.wallet.total_spent,
          formatted_balance: formatCurrency(result.wallet.balance)
        },
        summary: {
          previous_balance: updatedUser.wallet_balance + parsedAmount,
          new_balance: updatedUser.wallet_balance,
          change: -parsedAmount
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debit wallet error:', error);
    res.status(500).json({
      success: false,
      code: 'DEBIT_ERROR',
      message: 'Failed to debit wallet',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/wallet/history
 * @desc    Get wallet balance history for charts
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30, group_by = 'day' } = req.query;
    
    const wallet = await Wallet.findOrCreate(userId);
    
    // 🔥 GET BALANCE HISTORY
    const balanceHistory = await wallet.getBalanceHistory(parseInt(days));
    
    // 🔥 GET RECENT TRANSACTIONS
    const recentTransactions = await wallet.getTransactionHistory({
      limit: 10,
      page: 1
    });
    
    // 🔥 CALCULATE STATS
    const totalCredits = balanceHistory.reduce((sum, day) => sum + (day.credits || 0), 0);
    const totalDebits = balanceHistory.reduce((sum, day) => sum + (day.debits || 0), 0);
    const netChange = totalCredits - totalDebits;
    
    res.json({
      success: true,
      code: 'HISTORY_FETCHED',
      message: 'Wallet history fetched successfully',
      data: {
        current_balance: wallet.balance,
        formatted_current_balance: formatCurrency(wallet.balance),
        available_balance: wallet.available_balance,
        locked_balance: wallet.locked_balance,
        balance_history: balanceHistory.map(day => ({
          date: day.date.toISOString().split('T')[0],
          credits: day.credits,
          debits: day.debits,
          net_change: day.net_change,
          transaction_count: day.transaction_count,
          formatted_credits: formatCurrency(day.credits),
          formatted_debits: formatCurrency(day.debits),
          formatted_net_change: formatCurrency(day.net_change)
        })),
        recent_transactions: recentTransactions.transactions.map(tx => ({
          id: tx._id,
          type: tx.type,
          amount: tx.amount,
          formatted_amount: formatCurrency(tx.amount),
          description: tx.description,
          status: tx.status,
          date: tx.createdAt.toISOString().split('T')[0]
        })),
        statistics: {
          total_credits: totalCredits,
          total_debits: totalDebits,
          net_change: netChange,
          formatted_total_credits: formatCurrency(totalCredits),
          formatted_total_debits: formatCurrency(totalDebits),
          formatted_net_change: formatCurrency(netChange),
          transaction_count: recentTransactions.pagination.total,
          avg_daily_change: days > 0 ? netChange / days : 0
        },
        period: {
          days: parseInt(days),
          group_by: group_by,
          start_date: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get wallet history error:', error);
    res.status(500).json({
      success: false,
      code: 'HISTORY_ERROR',
      message: 'Failed to fetch wallet history',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   POST /api/wallet/transfer
 * @desc    Transfer money to another user
 * @access  Private
 */
router.post('/transfer', auth, async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  
  try {
    const fromUserId = req.user.userId;
    const { to_user_id, amount, description = '' } = req.body;
    
    // 🔥 VALIDATE INPUT
    const parsedAmount = validateAmount(amount);
    
    if (!to_user_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'RECIPIENT_REQUIRED',
        message: 'Recipient user ID is required'
      });
    }
    
    if (fromUserId === to_user_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'SELF_TRANSFER',
        message: 'Cannot transfer to yourself'
      });
    }
    
    console.log(`🔄 Transfer from ${fromUserId} to ${to_user_id}, Amount: ${parsedAmount}`);
    
    // 🔥 GET SENDER WALLET
    const senderWallet = await Wallet.findOrCreate(fromUserId, { session });
    
    // 🔥 CHECK SENDER BALANCE
    if (senderWallet.available_balance < parsedAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient balance for transfer',
        available_balance: senderWallet.available_balance,
        formatted_available_balance: formatCurrency(senderWallet.available_balance)
      });
    }
    
    // 🔥 CHECK IF RECIPIENT EXISTS
    const recipient = await User.findById(to_user_id).session(session);
    if (!recipient) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'RECIPIENT_NOT_FOUND',
        message: 'Recipient user not found'
      });
    }
    
    // 🔥 GET RECIPIENT WALLET
    const recipientWallet = await Wallet.findOrCreate(to_user_id, { session });
    
    // 🔥 PERFORM TRANSFER
    // Debit from sender
    const senderResult = await senderWallet.debit(parsedAmount, {
      session,
      type: 'transfer_out',
      description: `Transfer to ${recipient.username}: ${description}`,
      metadata: {
        transfer_type: 'user_to_user',
        recipient_id: to_user_id,
        recipient_username: recipient.username,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }
    });
    
    // Credit to recipient
    const recipientResult = await recipientWallet.credit(parsedAmount, {
      session,
      type: 'transfer_in',
      description: `Transfer from ${req.user.name || req.user.username}: ${description}`,
      metadata: {
        transfer_type: 'user_to_user',
        sender_id: fromUserId,
        sender_username: req.user.name || req.user.username,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }
    });
    
    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();
    
    // 🔥 GET UPDATED USER DATA
    const senderUser = await User.findById(fromUserId).select('wallet_balance username');
    const recipientUser = await User.findById(to_user_id).select('wallet_balance username');
    
    console.log(`✅ Transfer successful: ${parsedAmount} from ${fromUserId} to ${to_user_id}`);
    
    res.json({
      success: true,
      code: 'TRANSFER_COMPLETED',
      message: 'Transfer completed successfully',
      data: {
        transfer: {
          amount: parsedAmount,
          formatted_amount: formatCurrency(parsedAmount),
          description: description,
          timestamp: new Date().toISOString()
        },
        sender: {
          id: senderUser._id,
          username: senderUser.username,
          previous_balance: senderUser.wallet_balance + parsedAmount,
          new_balance: senderUser.wallet_balance,
          formatted_new_balance: formatCurrency(senderUser.wallet_balance)
        },
        recipient: {
          id: recipientUser._id,
          username: recipientUser.username,
          previous_balance: recipientUser.wallet_balance - parsedAmount,
          new_balance: recipientUser.wallet_balance,
          formatted_new_balance: formatCurrency(recipientUser.wallet_balance)
        },
        transactions: {
          debit_transaction: {
            id: senderResult.transaction._id,
            transaction_id: senderResult.transaction.transaction_id,
            amount: senderResult.transaction.amount
          },
          credit_transaction: {
            id: recipientResult.transaction._id,
            transaction_id: recipientResult.transaction.transaction_id,
            amount: recipientResult.transaction.amount
          }
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Transfer error:', error);
    res.status(500).json({
      success: false,
      code: 'TRANSFER_ERROR',
      message: 'Failed to complete transfer',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   POST /api/wallet/lock-balance
 * @desc    Lock balance for pending transaction
 * @access  Private
 */
router.post('/lock-balance', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, reason = '' } = req.body;
    
    // 🔥 VALIDATE AMOUNT
    const parsedAmount = validateAmount(amount);
    
    console.log(`🔒 Locking balance for user ${userId}, Amount: ${parsedAmount}, Reason: ${reason}`);
    
    const wallet = await Wallet.findOrCreate(userId);
    
    // 🔥 LOCK BALANCE
    const updatedWallet = await wallet.lockBalance(parsedAmount, reason);
    
    // 🔥 GET UPDATED USER DATA
    const user = await User.findById(userId).select('wallet_balance');
    
    res.json({
      success: true,
      code: 'BALANCE_LOCKED',
      message: 'Balance locked successfully',
      data: {
        wallet: {
          balance: updatedWallet.balance,
          available_balance: updatedWallet.available_balance,
          locked_balance: updatedWallet.locked_balance,
          formatted_balance: formatCurrency(updatedWallet.balance),
          formatted_available_balance: formatCurrency(updatedWallet.available_balance),
          formatted_locked_balance: formatCurrency(updatedWallet.locked_balance)
        },
        user: {
          wallet_balance: user.wallet_balance,
          formatted_wallet_balance: formatCurrency(user.wallet_balance)
        },
        lock_details: {
          amount: parsedAmount,
          formatted_amount: formatCurrency(parsedAmount),
          reason: reason,
          timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Lock balance error:', error);
    res.status(500).json({
      success: false,
      code: 'LOCK_ERROR',
      message: 'Failed to lock balance',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   POST /api/wallet/unlock-balance
 * @desc    Unlock previously locked balance
 * @access  Private
 */
router.post('/unlock-balance', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, reason = '' } = req.body;
    
    // 🔥 VALIDATE AMOUNT
    const parsedAmount = validateAmount(amount);
    
    console.log(`🔓 Unlocking balance for user ${userId}, Amount: ${parsedAmount}, Reason: ${reason}`);
    
    const wallet = await Wallet.findOrCreate(userId);
    
    // 🔥 UNLOCK BALANCE
    const updatedWallet = await wallet.unlockBalance(parsedAmount, reason);
    
    // 🔥 GET UPDATED USER DATA
    const user = await User.findById(userId).select('wallet_balance');
    
    res.json({
      success: true,
      code: 'BALANCE_UNLOCKED',
      message: 'Balance unlocked successfully',
      data: {
        wallet: {
          balance: updatedWallet.balance,
          available_balance: updatedWallet.available_balance,
          locked_balance: updatedWallet.locked_balance,
          formatted_balance: formatCurrency(updatedWallet.balance),
          formatted_available_balance: formatCurrency(updatedWallet.available_balance),
          formatted_locked_balance: formatCurrency(updatedWallet.locked_balance)
        },
        user: {
          wallet_balance: user.wallet_balance,
          formatted_wallet_balance: formatCurrency(user.wallet_balance)
        },
        unlock_details: {
          amount: parsedAmount,
          formatted_amount: formatCurrency(parsedAmount),
          reason: reason,
          timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Unlock balance error:', error);
    res.status(500).json({
      success: false,
      code: 'UNLOCK_ERROR',
      message: 'Failed to unlock balance',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   GET /api/wallet/limits
 * @desc    Get wallet limits and settings
 * @access  Private
 */
router.get('/limits', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const wallet = await Wallet.findOrCreate(userId);
    
    res.json({
      success: true,
      code: 'LIMITS_FETCHED',
      message: 'Wallet limits fetched successfully',
      data: {
        limits: wallet.limits,
        settings: wallet.settings,
        daily_stats: wallet.daily_stats,
        formatted_limits: {
          daily_deposit_limit: formatCurrency(wallet.limits.daily_deposit_limit),
          daily_withdrawal_limit: formatCurrency(wallet.limits.daily_withdrawal_limit),
          max_deposit: formatCurrency(wallet.limits.max_deposit),
          max_withdrawal: formatCurrency(wallet.limits.max_withdrawal),
          min_deposit: formatCurrency(wallet.limits.min_deposit),
          min_withdrawal: formatCurrency(wallet.limits.min_withdrawal)
        },
        today_usage: {
          deposits_today: wallet.daily_stats.deposits_today,
          withdrawals_today: wallet.daily_stats.withdrawals_today,
          deposit_amount_today: wallet.daily_stats.deposit_amount_today,
          formatted_deposit_amount_today: formatCurrency(wallet.daily_stats.deposit_amount_today),
          withdrawal_amount_today: wallet.daily_stats.withdrawal_amount_today,
          formatted_withdrawal_amount_today: formatCurrency(wallet.daily_stats.withdrawal_amount_today),
          deposit_limit_remaining: Math.max(0, wallet.limits.daily_deposit_limit - wallet.daily_stats.deposit_amount_today),
          withdrawal_limit_remaining: Math.max(0, wallet.limits.daily_withdrawal_limit - wallet.daily_stats.withdrawal_amount_today)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get limits error:', error);
    res.status(500).json({
      success: false,
      code: 'LIMITS_ERROR',
      message: 'Failed to fetch wallet limits',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   PUT /api/wallet/settings
 * @desc    Update wallet settings
 * @access  Private
 */
router.put('/settings', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_SETTINGS',
        message: 'Valid settings object is required'
      });
    }
    
    const wallet = await Wallet.findOrCreate(userId);
    
    // 🔥 UPDATE SETTINGS
    wallet.settings = {
      ...wallet.settings,
      ...settings
    };
    
    await wallet.save();
    
    res.json({
      success: true,
      code: 'SETTINGS_UPDATED',
      message: 'Wallet settings updated successfully',
      data: {
        settings: wallet.settings
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({
      success: false,
      code: 'SETTINGS_ERROR',
      message: 'Failed to update wallet settings',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// 🔥 ADMIN ROUTES

/**
 * @route   GET /api/wallet/admin/user/:userId
 * @desc    Get user wallet (admin only)
 * @access  Admin
 */
router.get('/admin/user/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`👑 Admin ${req.user.userId} fetching wallet for user: ${userId}`);
    
    const [wallet, user] = await Promise.all([
      Wallet.findOrCreate(userId),
      User.findById(userId).select('username email phone wallet_balance total_earnings created_at')
    ]);
    
    // 🔥 GET TRANSACTION HISTORY
    const transactionHistory = await wallet.getTransactionHistory({
      limit: 20,
      page: 1
    });
    
    // 🔥 GET BALANCE HISTORY
    const balanceHistory = await wallet.getBalanceHistory(30);
    
    res.json({
      success: true,
      code: 'ADMIN_WALLET_FETCHED',
      message: 'User wallet fetched successfully (admin)',
      data: {
        user: {
          id: user?._id,
          username: user?.username,
          email: user?.email,
          phone: user?.phone,
          wallet_balance: wallet.balance,
          formatted_balance: formatCurrency(wallet.balance),
          total_earnings: wallet.total_earned,
          formatted_total_earnings: formatCurrency(wallet.total_earned),
          member_since: user?.created_at
        },
        wallet: {
          balance: wallet.balance,
          available_balance: wallet.available_balance,
          locked_balance: wallet.locked_balance,
          pending_balance: wallet.pending_balance,
          total_earned: wallet.total_earned,
          total_spent: wallet.total_spent,
          total_deposited: wallet.total_deposited,
          total_withdrawn: wallet.total_withdrawn,
          total_bonus: wallet.total_bonus
        },
        recent_transactions: transactionHistory.transactions.slice(0, 10).map(tx => ({
          id: tx._id,
          type: tx.type,
          amount: tx.amount,
          formatted_amount: formatCurrency(tx.amount),
          description: tx.description,
          status: tx.status,
          created_at: tx.createdAt
        })),
        balance_history: balanceHistory.slice(0, 14).map(day => ({
          date: day.date.toISOString().split('T')[0],
          net_change: day.net_change,
          transaction_count: day.transaction_count
        })),
        security: {
          suspicious_activity_count: wallet.security?.suspicious_activity_count || 0,
          locked_until: wallet.security?.locked_until
        },
        admin_view: true,
        viewed_by: {
          admin_id: req.user.userId,
          admin_name: req.user.name || req.user.username,
          viewed_at: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Admin get wallet error:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_WALLET_ERROR',
      message: 'Failed to fetch user wallet',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   POST /api/wallet/admin/manual-adjustment
 * @desc    Manual balance adjustment (admin only)
 * @access  Admin
 */
router.post('/admin/manual-adjustment', adminAuth, async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  
  try {
    const { user_id, amount, type, description, reason } = req.body;
    const adminId = req.user.userId;
    const adminName = req.user.name || req.user.username;
    
    // 🔥 VALIDATE INPUT
    if (!user_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'USER_ID_REQUIRED',
        message: 'User ID is required'
      });
    }
    
    const parsedAmount = validateAmount(amount);
    
    const validTypes = ['credit', 'debit'];
    if (!validTypes.includes(type)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_TYPE',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
    }
    
    if (!reason) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'REASON_REQUIRED',
        message: 'Adjustment reason is required'
      });
    }
    
    console.log(`👑 Admin ${adminId} making manual adjustment for user ${user_id}: ${type} ${parsedAmount}`);
    
    // 🔥 GET USER
    const user = await User.findById(user_id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }
    
    // 🔥 GET WALLET
    const wallet = await Wallet.findOrCreate(user_id, { session });
    
    let result;
    if (type === 'credit') {
      result = await wallet.credit(parsedAmount, {
        session,
        type: 'admin_credit',
        description: `Manual adjustment: ${description || reason}`,
        metadata: {
          adjustment_type: 'manual',
          adjusted_by: adminId,
          adjusted_by_name: adminName,
          reason: reason,
          admin_notes: description,
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        }
      });
    } else {
      // Check balance for debit
      if (wallet.available_balance < parsedAmount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          code: 'INSUFFICIENT_BALANCE',
          message: 'User has insufficient balance for debit adjustment',
          available_balance: wallet.available_balance
        });
      }
      
      result = await wallet.debit(parsedAmount, {
        session,
        type: 'admin_debit',
        description: `Manual adjustment: ${description || reason}`,
        metadata: {
          adjustment_type: 'manual',
          adjusted_by: adminId,
          adjusted_by_name: adminName,
          reason: reason,
          admin_notes: description,
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        }
      });
    }
    
    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();
    
    // 🔥 GET UPDATED USER DATA
    const updatedUser = await User.findById(user_id).select('wallet_balance username');
    
    console.log(`✅ Manual adjustment completed for user ${user_id}`);
    
    res.json({
      success: true,
      code: 'ADJUSTMENT_COMPLETED',
      message: 'Manual adjustment completed successfully',
      data: {
        adjustment: {
          type: type,
          amount: parsedAmount,
          formatted_amount: formatCurrency(parsedAmount),
          reason: reason,
          description: description,
          timestamp: new Date().toISOString()
        },
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          previous_balance: type === 'credit' 
            ? updatedUser.wallet_balance - parsedAmount 
            : updatedUser.wallet_balance + parsedAmount,
          new_balance: updatedUser.wallet_balance,
          formatted_new_balance: formatCurrency(updatedUser.wallet_balance)
        },
        wallet: {
          balance: result.wallet.balance,
          available_balance: result.wallet.available_balance,
          formatted_balance: formatCurrency(result.wallet.balance)
        },
        transaction: {
          id: result.transaction._id,
          transaction_id: result.transaction.transaction_id,
          type: result.transaction.type
        },
        admin: {
          id: adminId,
          name: adminName
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Manual adjustment error:', error);
    res.status(500).json({
      success: false,
      code: 'ADJUSTMENT_ERROR',
      message: 'Failed to complete manual adjustment',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   GET /api/wallet/admin/transactions
 * @desc    Get all transactions with filters (admin only)
 * @access  Admin
 */
router.get('/admin/transactions', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      user_id = null,
      type = null,
      status = null,
      start_date = null,
      end_date = null,
      min_amount = null,
      max_amount = null,
      search = null,
      sort_by = '-createdAt'
    } = req.query;
    
    // 🔥 BUILD FILTER
    const filter = {};
    
    if (user_id) {
      filter.user_id = user_id;
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) filter.createdAt.$lte = new Date(end_date);
    }
    
    if (min_amount || max_amount) {
      filter.amount = {};
      if (min_amount) filter.amount.$gte = Number(min_amount);
      if (max_amount) filter.amount.$lte = Number(max_amount);
    }
    
    if (search) {
      filter.$or = [
        { description: new RegExp(search, 'i') },
        { reference_id: new RegExp(search, 'i') },
        { transaction_id: new RegExp(search, 'i') }
      ];
    }
    
    // 🔥 CALCULATE PAGINATION
    const skip = (Number(page) - 1) * Number(limit);
    const sort = sort_by.startsWith('-') 
      ? { [sort_by.substring(1)]: -1 } 
      : { [sort_by]: 1 };
    
    // 🔥 GET TRANSACTIONS WITH USER DATA
    const transactions = await Transaction.find(filter)
      .populate('user_id', 'username email phone')
      .populate('processed_by', 'username')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .lean();
    
    // 🔥 GET TOTAL COUNT
    const total = await Transaction.countDocuments(filter);
    
    // 🔥 CALCULATE STATS
    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_amount: { $sum: '$amount' },
          credit_total: {
            $sum: {
              $cond: [
                { $in: ['$type', ['credit', 'deposit', 'win', 'bonus', 'refund', 'transfer_in']] },
                '$amount',
                0
              ]
            }
          },
          debit_total: {
            $sum: {
              $cond: [
                { $in: ['$type', ['debit', 'withdrawal', 'entry_fee', 'payment', 'transfer_out']] },
                '$amount',
                0
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // 🔥 FORMAT TRANSACTIONS
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      transaction_id: tx.transaction_id,
      type: tx.type,
      amount: tx.amount,
      formatted_amount: formatCurrency(tx.amount),
      description: tx.description,
      status: tx.status,
      payment_method: tx.payment_method,
      reference_id: tx.reference_id,
      user: tx.user_id ? {
        id: tx.user_id._id,
        username: tx.user_id.username,
        email: tx.user_id.email
      } : null,
      processed_by: tx.processed_by ? {
        username: tx.processed_by.username
      } : null,
      created_at: tx.createdAt,
      formatted_created_at: tx.createdAt.toISOString(),
      metadata: tx.metadata
    }));
    
    res.json({
      success: true,
      code: 'ADMIN_TRANSACTIONS_FETCHED',
      message: 'Transactions fetched successfully (admin)',
      data: {
        transactions: formattedTransactions,
        statistics: stats[0] ? {
          total_amount: stats[0].total_amount,
          formatted_total_amount: formatCurrency(stats[0].total_amount),
          credit_total: stats[0].credit_total,
          formatted_credit_total: formatCurrency(stats[0].credit_total),
          debit_total: stats[0].debit_total,
          formatted_debit_total: formatCurrency(stats[0].debit_total),
          transaction_count: stats[0].count
        } : {
          total_amount: 0,
          formatted_total_amount: formatCurrency(0),
          credit_total: 0,
          debit_total: 0,
          transaction_count: 0
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
          has_next: Number(page) < Math.ceil(total / Number(limit)),
          has_prev: Number(page) > 1
        },
        filters: {
          user_id,
          type,
          status,
          start_date,
          end_date,
          min_amount,
          max_amount,
          search,
          sort_by
        },
        admin_view: true,
        viewed_by: {
          admin_id: req.user.userId,
          admin_name: req.user.name || req.user.username
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Admin get transactions error:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_TRANSACTIONS_ERROR',
      message: 'Failed to fetch transactions',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * @route   GET /api/wallet/admin/summary
 * @desc    Get system-wide wallet summary (admin only)
 * @access  Admin
 */
router.get('/admin/summary', adminAuth, async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    let startDate, endDate = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    // 🔥 GET SYSTEM STATS
    const [
      totalUsers,
      totalWallets,
      totalBalance,
      todayTransactions,
      userStats,
      transactionStats,
      topUsers
    ] = await Promise.all([
      User.countDocuments(),
      Wallet.countDocuments(),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]),
      Transaction.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      User.aggregate([
        {
          $group: {
            _id: null,
            avg_balance: { $avg: '$wallet_balance' },
            max_balance: { $max: '$wallet_balance' },
            min_balance: { $min: '$wallet_balance' }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$type',
            total_amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Wallet.aggregate([
        { $sort: { balance: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            user_id: 1,
            username: '$user.username',
            email: '$user.email',
            balance: 1,
            formatted_balance: formatCurrency('$balance'),
            total_earned: 1,
            total_spent: 1
          }
        }
      ])
    ]);
    
    // 🔥 GET DAILY TRANSACTIONS FOR CHART
    const dailyTransactions = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      code: 'SYSTEM_SUMMARY_FETCHED',
      message: 'System wallet summary fetched successfully',
      data: {
        period: period,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        overview: {
          total_users: totalUsers,
          total_wallets: totalWallets,
          total_balance: totalBalance[0]?.total || 0,
          formatted_total_balance: formatCurrency(totalBalance[0]?.total || 0),
          today_transactions: todayTransactions
        },
        user_statistics: userStats[0] ? {
          average_balance: userStats[0].avg_balance,
          formatted_average_balance: formatCurrency(userStats[0].avg_balance),
          maximum_balance: userStats[0].max_balance,
          formatted_maximum_balance: formatCurrency(userStats[0].max_balance),
          minimum_balance: userStats[0].min_balance,
          formatted_minimum_balance: formatCurrency(userStats[0].min_balance)
        } : null,
        transaction_statistics: {
          by_type: transactionStats.map(stat => ({
            type: stat._id,
            total_amount: stat.total_amount,
            formatted_total_amount: formatCurrency(stat.total_amount),
            count: stat.count,
            percentage: ((stat.total_amount / (totalBalance[0]?.total || 1)) * 100).toFixed(2)
          })),
          daily_summary: dailyTransactions.map(day => ({
            date: day._id,
            total_amount: day.total_amount,
            formatted_total_amount: formatCurrency(day.total_amount),
            count: day.count
          }))
        },
        top_users: topUsers,
        system_health: {
          database: 'connected',
          last_updated: new Date().toISOString(),
          memory_usage: process.memoryUsage(),
          uptime: process.uptime()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ System summary error:', error);
    res.status(500).json({
      success: false,
      code: 'SYMMARY_ERROR',
      message: 'Failed to fetch system summary',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

module.exports = router;
