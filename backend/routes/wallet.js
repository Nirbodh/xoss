// routes/wallet.js - COMPLETELY FIXED WITH JWT AUTH
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // ✅ JWT auth ব্যবহার করুন
const { Wallet } = require('../models/Wallet');

// ✅ GET WALLET BALANCE (USING JWT AUTH)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`💰 Fetching wallet for user ID: ${userId}`);
    
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

// ✅ CREDIT WALLET
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

// ✅ TRANSFER MONEY TO ANOTHER USER
router.post('/transfer', auth, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { recipientId, amount, description = '' } = req.body;
    
    if (!recipientId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and valid amount required'
      });
    }
    
    console.log(`💸 Transfer request: ${senderId} -> ${recipientId}, Amount: ${amount}`);
    
    // Get sender's wallet
    const senderWallet = await Wallet.findOrCreate(senderId);
    
    // Check if sender has sufficient balance
    if (!senderWallet.hasSufficientBalance(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    // Get recipient's wallet
    const recipientWallet = await Wallet.findOrCreate(recipientId);
    
    // Perform transfer
    const debitResult = await senderWallet.debit(
      amount, 
      `Transfer to user ${recipientId}${description ? ': ' + description : ''}`,
      { 
        type: 'transfer', 
        recipientId, 
        transactionType: 'outgoing' 
      }
    );
    
    const creditResult = await recipientWallet.credit(
      amount,
      `Transfer from user ${senderId}${description ? ': ' + description : ''}`,
      { 
        type: 'transfer', 
        senderId, 
        transactionType: 'incoming' 
      }
    );
    
    res.json({
      success: true,
      message: 'Transfer successful',
      data: {
        sender_new_balance: debitResult.wallet.balance,
        recipient_new_balance: creditResult.wallet.balance,
        sender_transaction: debitResult.transaction,
        recipient_transaction: creditResult.transaction
      }
    });
    
  } catch (error) {
    console.error('❌ Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer failed',
      error: error.message
    });
  }
});

module.exports = router;
