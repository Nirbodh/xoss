// routes/wallet.js - COMPLETELY FIXED
const express = require('express');
const router = express.Router();
const { Wallet } = require('../models/Wallet');

// ✅ SIMPLE AUTH MIDDLEWARE
const simpleAuth = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'] || req.query.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User ID required' 
      });
    }

    req.user = { userId };
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
};

// ✅ GET WALLET BALANCE
router.get('/', simpleAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`💰 Fetching wallet for user: ${userId}`);
    
    const wallet = await Wallet.findOrCreate(userId);
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        total_earned: wallet.total_earned,
        total_spent: wallet.total_spent,
        last_activity: wallet.last_activity
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
router.get('/transactions', simpleAuth, async (req, res) => {
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

// ✅ CREDIT WALLET
router.post('/credit', simpleAuth, async (req, res) => {
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
        new_balance: result.wallet.balance,
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

module.exports = router;
