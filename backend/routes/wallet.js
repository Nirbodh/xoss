const express = require('express');
const { Wallet, Transaction } = require('../models/Wallet');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get wallet balance
router.get('/balance', auth, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user_id: req.user.userId });
    
    if (!wallet) {
      // Create wallet if doesn't exist
      wallet = new Wallet({ user_id: req.user.userId });
      await wallet.save();
    }
    
    res.json({
      success: true,
      balance: wallet.balance,
      total_earned: wallet.total_earned,
      total_spent: wallet.total_spent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const transactions = await Transaction.find({ user_id: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Transaction.countDocuments({ user_id: req.user.userId });
    
    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Add credit to wallet (Admin only or payment gateway)
router.post('/credit', auth, async (req, res) => {
  try {
    const { amount, description = 'Wallet top-up', metadata = {} } = req.body;
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }
    
    let wallet = await Wallet.findOne({ user_id: req.user.userId });
    
    if (!wallet) {
      wallet = new Wallet({ user_id: req.user.userId });
    }
    
    await wallet.credit(amount, description, metadata);
    
    res.json({
      success: true,
      message: 'Wallet credited successfully',
      new_balance: wallet.balance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Process entry fee payment
router.post('/pay-entry-fee', auth, async (req, res) => {
  try {
    const { amount, tournamentId, matchId, description } = req.body;
    
    let wallet = await Wallet.findOne({ user_id: req.user.userId });
    
    if (!wallet) {
      wallet = new Wallet({ user_id: req.user.userId });
      await wallet.save();
    }
    
    await wallet.debit(
      amount, 
      description || 'Tournament entry fee',
      { tournamentId, matchId, type: 'entry_fee' }
    );
    
    res.json({
      success: true,
      message: 'Entry fee paid successfully',
      new_balance: wallet.balance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
