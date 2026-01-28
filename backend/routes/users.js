const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// ✅ GET user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const formattedUser = user.getFormattedUser ? user.getFormattedUser() : user;
    
    res.json({
      success: true,
      data: formattedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ UPDATE user
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-password');
    
    const formattedUser = user.getFormattedUser ? user.getFormattedUser() : user;
    
    res.json({
      success: true,
      message: 'Profile updated',
      data: formattedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ GET user statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');
    
    const [matches, tournaments] = await Promise.all([
      Match.countDocuments({ participants: req.params.id }),
      Tournament.countDocuments({ 'participants.user': req.params.id })
    ]);
    
    const user = await User.findById(req.params.id).select('stats matches_played matches_won');
    
    let winRate = 0;
    if (user) {
      const matchesPlayed = user.stats?.matches_played || user.matches_played || 0;
      const matchesWon = user.stats?.matches_won || user.matches_won || 0;
      if (matchesPlayed > 0) {
        winRate = (matchesWon / matchesPlayed) * 100;
      }
    }
    
    res.json({
      success: false,
      data: {
        totalMatches: matches,
        totalTournaments: tournaments,
        winRate: winRate.toFixed(2),
        userStats: user?.stats || {
          matches_played: user?.matches_played || 0,
          matches_won: user?.matches_won || 0,
          win_rate: winRate.toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ✅✅ IMPORTANT: ADD POINTS CONVERSION ENDPOINT HERE
// POST /api/users/convert-points
router.post('/convert-points', auth, async (req, res) => {
  try {
    console.log('💰 Points conversion request by user:', req.user.userId);
    
    // Find user with points data
    const user = await User.findById(req.user.userId)
      .select('+points +wallet +wallet_balance');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check current points
    const currentPoints = user.points || 0;
    console.log('📊 Current points:', currentPoints);
    
    // Minimum 100 points required
    if (currentPoints < 100) {
      return res.status(400).json({
        success: false,
        message: 'কনভার্ট করতে ন্যূনতম ১০০ পয়েন্ট প্রয়োজন',
        required: 100,
        available: currentPoints,
        points_needed: 100 - currentPoints
      });
    }
    
    // Calculate money amount (100 points = 10 টাকা)
    const conversionRate = 0.10; // 100 points = 10 টাকা
    const moneyAmount = currentPoints * conversionRate;
    
    console.log('🧮 Conversion:', {
      points: currentPoints,
      rate: conversionRate,
      money: moneyAmount.toFixed(2)
    });
    
    // Create transaction record
    const transaction = await Transaction.create({
      user_id: user._id,
      type: 'points_conversion',
      amount: moneyAmount,
      description: `Converted ${currentPoints} points to ৳${moneyAmount.toFixed(2)}`,
      status: 'completed',
      metadata: {
        points_converted: currentPoints,
        conversion_rate: conversionRate,
        money_added: moneyAmount
      }
    });
    
    console.log('✅ Transaction created:', transaction._id);
    
    // Update user points and wallet
    user.points = 0; // Reset points to zero
    
    // Add money to wallet
    if (!user.wallet) user.wallet = {};
    user.wallet.balance = (user.wallet.balance || 0) + moneyAmount;
    user.wallet.total_earned = (user.wallet.total_earned || 0) + moneyAmount;
    
    // Sync other balance fields
    user.wallet_balance = user.wallet.balance;
    user.balance = user.wallet.balance;
    
    // Add to points history
    if (!user.points_history) user.points_history = [];
    user.points_history.push({
      type: 'conversion',
      amount: -currentPoints, // Negative because we're deducting
      description: `Converted ${currentPoints} points to ৳${moneyAmount.toFixed(2)}`,
      timestamp: new Date(),
      reference_id: transaction._id,
      ref_model: 'Transaction'
    });
    
    // Save user
    await user.save({ validateBeforeSave: false });
    
    console.log('✅ User updated successfully');
    
    // Get updated wallet
    const wallet = await Wallet.findOneAndUpdate(
      { user_id: user._id },
      { 
        $inc: { 
          balance: moneyAmount,
          total_earned: moneyAmount
        },
        $set: { last_transaction: new Date() }
      },
      { new: true, upsert: true }
    );
    
    console.log('✅ Wallet updated:', wallet.balance);
    
    // Get formatted user for response
    const updatedUser = await User.findById(user._id);
    const formattedUser = updatedUser.getFormattedUser ? updatedUser.getFormattedUser() : updatedUser;
    
    res.json({
      success: true,
      message: 'পয়েন্ট সফলভাবে টাকায় কনভার্ট হয়েছে!',
      data: {
        user: formattedUser,
        conversion: {
          points_converted: currentPoints,
          money_added: moneyAmount.toFixed(2),
          conversion_rate: conversionRate,
          transaction_id: transaction._id,
          new_balance: formattedUser.walletBalance || formattedUser.balance || 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Points conversion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'পয়েন্ট কনভার্ট করতে সমস্যা হয়েছে'
    });
  }
});

// ✅ GET user points info
router.get('/points/info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('points points_history wallet_balance');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const canConvert = (user.points || 0) >= 100;
    const conversionValue = ((user.points || 0) * 0.10).toFixed(2);
    
    res.json({
      success: true,
      data: {
        points: user.points || 0,
        can_convert: canConvert,
        conversion_value: conversionValue,
        wallet_balance: user.wallet_balance || user.wallet?.balance || 0,
        points_history: user.points_history || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
