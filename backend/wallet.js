// routes/wallet.js - COMPLETELY FIXED FOR REAL-TIME UPDATES
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Wallet, Transaction } = require('../models/Wallet');

// GET WALLET BALANCE
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`💰 Fetching wallet for user: ${userId}`);
    
    let wallet = await Wallet.findOne({ user_id: userId });
    
    if (!wallet) {
      wallet = new Wallet({
        user_id: userId,
        balance: 0,
        total_earned: 0,
        total_spent: 0,
        last_activity: new Date()
      });
      await wallet.save();
      console.log(`🆕 New wallet created for user: ${userId}`);
    }
    
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

// GET WALLET TRANSACTIONS
router.get('/transactions', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, page = 1 } = req.query;
    
    const transactions = await Transaction.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Transaction.countDocuments({ user_id: userId });
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
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

// WALLET TRANSFER (for sending gift)
router.post('/transfer', auth, async (req, res) => {
  try {
    const { recipientId, amount, description, note } = req.body;
    const senderId = req.user.userId;
    
    if (!recipientId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Recipient and amount are required'
      });
    }
    
    const sendAmount = parseFloat(amount);
    if (sendAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be positive'
      });
    }
    
    // Get sender's wallet
    const senderWallet = await Wallet.findOne({ user_id: senderId });
    if (!senderWallet) {
      return res.status(404).json({
        success: false,
        message: 'Sender wallet not found'
      });
    }
    
    // Check balance
    if (senderWallet.balance < sendAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    // Get recipient's wallet
    let recipientWallet = await Wallet.findOne({ user_id: recipientId });
    if (!recipientWallet) {
      recipientWallet = new Wallet({
        user_id: recipientId,
        balance: 0,
        total_earned: 0,
        total_spent: 0
      });
      await recipientWallet.save();
    }
    
    // Start transaction session
    const session = await Wallet.startSession();
    session.startTransaction();
    
    try {
      // Deduct from sender
      senderWallet.balance -= sendAmount;
      senderWallet.total_spent += sendAmount;
      senderWallet.last_activity = new Date();
      await senderWallet.save({ session });
      
      // Add to recipient
      recipientWallet.balance += sendAmount;
      recipientWallet.total_earned += sendAmount;
      recipientWallet.last_activity = new Date();
      await recipientWallet.save({ session });
      
      // Create transaction records
      const senderTransaction = new Transaction({
        user_id: senderId,
        type: 'debit',
        amount: sendAmount,
        description: description || `Transfer to user ${recipientId}`,
        status: 'completed',
        method: 'transfer',
        reference_id: `TRF_${Date.now()}`,
        metadata: {
          recipientId,
          note: note || ''
        }
      });
      
      const recipientTransaction = new Transaction({
        user_id: recipientId,
        type: 'credit',
        amount: sendAmount,
        description: description || `Transfer from user ${senderId}`,
        status: 'completed',
        method: 'transfer',
        reference_id: `TRF_${Date.now()}`,
        metadata: {
          senderId,
          note: note || ''
        }
      });
      
      await senderTransaction.save({ session });
      await recipientTransaction.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      res.json({
        success: true,
        message: 'Transfer successful',
        data: {
          newBalance: senderWallet.balance,
          transactionId: senderTransaction._id
        }
      });
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer failed',
      error: error.message
    });
  }
});

// CREDIT WALLET (for deposits)
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
    
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    wallet.balance += parseFloat(amount);
    wallet.total_earned += parseFloat(amount);
    wallet.last_activity = new Date();
    await wallet.save();
    
    const transaction = await Transaction.create({
      user_id: userId,
      type: 'credit',
      amount: parseFloat(amount),
      description: description || 'Deposit',
      status: 'completed',
      method: metadata.method || 'deposit',
      reference_id: metadata.reference_id || `DEP_${Date.now()}`,
      metadata
    });
    
    res.json({
      success: true,
      data: {
        new_balance: wallet.balance,
        transaction
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
