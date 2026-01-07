// routes/wallet.js - UPDATED VERSION
const express = require('express');
const router = express.Router();
const { Wallet } = require('../models/Wallet');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// ✅ GET WALLET BALANCE (with user sync)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`💰 Fetching wallet for user: ${userId}`);
    
    // Get both wallet and user data
    const [wallet, user] = await Promise.all([
      Wallet.findOrCreate(userId),
      User.findById(userId).select('username email wallet_balance total_earnings')
    ]);
    
    // ✅ Ensure sync between wallet and user
    if (Math.abs(wallet.balance - (user?.wallet_balance || 0)) > 1) {
      console.warn(`⚠️ Balance mismatch detected for user ${userId}: Wallet=${wallet.balance}, User=${user?.wallet_balance}`);
      
      // Sync them
      await User.findByIdAndUpdate(userId, {
        wallet_balance: wallet.balance,
        total_earnings: wallet.total_earned
      });
      
      console.log(`✅ Balance synced for user ${userId}: ${wallet.balance}`);
    }
    
    res.json({
      success: true,
      data: {
        user: {
          username: user?.username,
          email: user?.email,
          wallet_balance: wallet.balance, // Use wallet balance as source of truth
          total_earnings: wallet.total_earned
        },
        wallet: {
          balance: wallet.balance,
          total_earned: wallet.total_earned,
          total_spent: wallet.total_spent,
          last_activity: wallet.last_activity
        }
      },
      message: 'Wallet fetched successfully'
    });
  } catch (error) {
    console.error('❌ Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet',
      error: error.message
    });
  }
});

// ✅ GET WALLET TRANSACTIONS
router.get('/transactions', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const wallet = await Wallet.findOrCreate(userId);
    const transactionHistory = await wallet.getTransactionHistory(parseInt(limit), parseInt(page));
    
    res.json({
      success: true,
      data: transactionHistory,
      message: 'Transactions fetched successfully'
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// ✅ CREDIT WALLET (with user sync)
router.post('/credit', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, description, metadata = {} } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }
    
    console.log(`💰 Crediting wallet for user: ${userId}, Amount: ${amount}`);
    
    const wallet = await Wallet.findOrCreate(userId);
    const result = await wallet.credit(amount, description, metadata);
    
    res.json({
      success: true,
      data: {
        user: {
          wallet_balance: result.wallet.balance
        },
        wallet: {
          balance: result.wallet.balance,
          total_earned: result.wallet.total_earned,
          total_spent: result.wallet.total_spent
        },
        transaction: result.transaction
      },
      message: 'Wallet credited successfully'
    });
  } catch (error) {
    console.error('❌ Credit wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to credit wallet',
      error: error.message
    });
  }
});

// ✅ DEBIT WALLET (with user sync)
router.post('/debit', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, description, metadata = {} } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }
    
    console.log(`💰 Debiting wallet for user: ${userId}, Amount: ${amount}`);
    
    const wallet = await Wallet.findOrCreate(userId);
    const result = await wallet.debit(amount, description, metadata);
    
    res.json({
      success: true,
      data: {
        user: {
          wallet_balance: result.wallet.balance
        },
        wallet: {
          balance: result.wallet.balance,
          total_earned: result.wallet.total_earned,
          total_spent: result.wallet.total_spent
        },
        transaction: result.transaction
      },
      message: 'Wallet debited successfully'
    });
  } catch (error) {
    console.error('❌ Debit wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to debit wallet',
      error: error.message
    });
  }
});

// ✅ GET BALANCE HISTORY (for charts)
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;
    
    const wallet = await Wallet.findOrCreate(userId);
    
    // Get transactions for the last X days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const transactions = await wallet.getTransactionHistory(100, 1);
    
    res.json({
      success: true,
      data: {
        current_balance: wallet.balance,
        total_earned: wallet.total_earned,
        total_spent: wallet.total_spent,
        recent_transactions: transactions.transactions.slice(0, 10)
      },
      message: 'Wallet history fetched successfully'
    });
  } catch (error) {
    console.error('❌ Get wallet history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet history',
      error: error.message
    });
  }
});

module.exports = router;
