// routes/matches.js - DATABASE SAFE FIX
const express = require('express');
const mongoose = require('mongoose');
const Match = require('../models/Match');
const { Wallet, Transaction } = require('../models/Wallet');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ✅ FIXED: JOIN match WITH PAYMENT - DATABASE SAFE
router.post('/:id/join-with-payment', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('💳 JOIN match WITH PAYMENT request:', req.params.id);
    
    const match = await Match.findById(req.params.id).session(session);

    if (!match) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }

    if (match.approval_status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This match is not approved yet'
      });
    }

    if (match.status !== 'upcoming') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Match is not joinable'
      });
    }

    // ✅ DATABASE SAFE: participants না থাকলে ডিফল্ট array ব্যবহার করুন
    const participantsArray = match.participants || [];
    const alreadyJoined = participantsArray.some(
      participant => participant.user && participant.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Already joined this match'
      });
    }

    if (match.current_participants >= match.max_participants) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'No spots left in this match'
      });
    }

    const entryFee = match.entry_fee || 0;
    
    console.log(`💰 Entry Fee: ${entryFee}, User ID: ${userId}`);
    
    if (entryFee > 0) {
      try {
        const wallet = await Wallet.findOne({ user_id: userId }).session(session);
        
        if (!wallet) {
          const newWallet = await Wallet.findOrCreate(userId);
          console.log('🆕 New wallet created for user:', userId);
          
          if (newWallet.balance < entryFee) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Insufficient balance. Required: ৳${entryFee}, Available: ৳${newWallet.balance}`,
              required: entryFee,
              available: newWallet.balance
            });
          }
          
          newWallet.balance -= entryFee;
          newWallet.total_spent += entryFee;
          newWallet.last_activity = new Date();
          await newWallet.save({ session });

          await Transaction.create([{
            user_id: userId,
            type: 'debit',
            amount: entryFee,
            description: `Match Entry Fee: ${match.title}`,
            status: 'completed',
            method: 'match_entry',
            reference_id: match._id.toString(),
            metadata: {
              match_id: match._id,
              match_title: match.title,
              match_type: 'match'
            }
          }], { session });

          console.log(`✅ Wallet debited: ${userId}, Amount: ${entryFee}, New Balance: ${newWallet.balance}`);
        } else {
          console.log(`💰 Wallet Balance: ${wallet.balance}, Required: ${entryFee}`);
          
          if (wallet.balance < entryFee) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Insufficient balance. Required: ৳${entryFee}, Available: ৳${wallet.balance}`,
              required: entryFee,
              available: wallet.balance
            });
          }

          wallet.balance -= entryFee;
          wallet.total_spent += entryFee;
          wallet.last_activity = new Date();
          await wallet.save({ session });

          await Transaction.create([{
            user_id: userId,
            type: 'debit',
            amount: entryFee,
            description: `Match Entry Fee: ${match.title}`,
            status: 'completed',
            method: 'match_entry',
            reference_id: match._id.toString(),
            metadata: {
              match_id: match._id,
              match_title: match.title,
              match_type: 'match'
            }
          }], { session });

          console.log(`✅ Wallet debited: ${userId}, Amount: ${entryFee}, New Balance: ${wallet.balance}`);
        }
      } catch (walletError) {
        console.error('❌ Wallet error:', walletError);
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
          success: false,
          message: 'Wallet transaction failed',
          error: walletError.message
        });
      }
    }

    const participantData = {
      user: userId,
      status: 'joined',
      joined_at: new Date(),
      payment_status: entryFee > 0 ? 'paid' : 'free',
      amount_paid: entryFee
    };

    if (req.body.game_uid || req.body.gameUID) {
      participantData.game_uid = req.body.game_uid || req.body.gameUID;
    }
    if (req.body.game_name || req.body.gameName) {
      participantData.game_name = req.body.game_name || req.body.gameName;
    }

    // ✅ DATABASE SAFE: participants না থাকলে নতুন array তৈরি করুন
    if (!match.participants) {
      match.participants = [];
    }

    match.participants.push(participantData);
    match.current_participants += 1;
    
    await match.save({ session });

    await session.commitTransaction();
    session.endSession();

    console.log(`✅ User ${userId} joined match ${match._id} with payment`);

    res.json({
      success: true,
      message: entryFee > 0 
        ? `Successfully joined match! ৳${entryFee} deducted from your wallet.` 
        : 'Successfully joined match!',
      data: {
        match,
        payment: {
          amount: entryFee,
          status: 'deducted',
          transaction_id: 'completed'
        },
        spots_left: match.max_participants - match.current_participants
      }
    });

  } catch (error) {
    console.error('❌ JOIN WITH PAYMENT error:', error);
    
    try {
      await session.abortTransaction();
      session.endSession();
    } catch (sessionError) {
      console.error('Session abort error:', sessionError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to join match with payment',
      error: error.message
    });
  }
});

// ✅ FIXED: JOIN match (without payment) - DATABASE SAFE
router.post('/:id/join', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }

    if (match.approval_status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This match is not approved yet'
      });
    }

    if (match.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Match is not joinable'
      });
    }

    // ✅ DATABASE SAFE: participants না থাকলে ডিফল্ট array ব্যবহার করুন
    const participantsArray = match.participants || [];
    const alreadyJoined = participantsArray.some(
      participant => participant.user && participant.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this match'
      });
    }

    if (match.current_participants >= match.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'No spots left in this match'
      });
    }

    if (!match.participants) {
      match.participants = [];
    }

    match.participants.push({
      user: userId,
      status: 'joined'
    });

    match.current_participants += 1;
    await match.save();

    await match.populate('participants.user', 'username');

    res.json({
      success: true,
      message: 'Successfully joined match',
      data: match
    });
  } catch (error) {
    console.error('❌ JOIN match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join match',
      error: error.message
    });
  }
});

// ... [Previous GET, POST, PUT, DELETE routes remain EXACTLY SAME] ...

module.exports = router;
