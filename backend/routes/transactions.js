const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// ✅ CREATE Transaction
router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, description, metadata } = req.body;
    
    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Type and amount are required'
      });
    }
    
    const transaction = new Transaction({
      user: req.user.userId,
      type,
      amount,
      description,
      status: 'pending',
      metadata
    });
    
    await transaction.save();
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all transactions for a user
router.get('/user/:userId', auth, async (req, res) => {
  // existing code...
});

// Admin: Get all transactions
router.get('/', auth, async (req, res) => {
  // existing code...
});

module.exports = router;
