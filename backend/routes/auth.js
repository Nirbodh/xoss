// routes/auth.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ FIXED LOGIN ROUTE
router.post('/login', async (req, res) => {
  console.log('🔐 LOGIN REQUEST RECEIVED:', { 
    email: req.body.email,
    timestamp: new Date().toISOString() 
  });

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // ✅ FIX 1: সরাসরি MongoDB query (Model bypass)
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    // Direct collection access
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({
      email: email.toLowerCase().trim()
    });

    console.log('🔍 DATABASE RESULT:', {
      found: !!user,
      email: user?.email,
      hasPassword: !!user?.password,
      userId: user?._id
    });

    // User not found
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // No password in database
    if (!user.password) {
      console.log('⚠️ USER HAS NO PASSWORD IN DB:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Account setup incomplete. Please reset password.' 
      });
    }

    // ✅ FIX 2: Direct bcrypt compare
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔐 PASSWORD COMPARISON:', { match: isMatch });

    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check account status
    if (user.is_active === false || user.account_status === 'suspended') {
      return res.status(403).json({ 
        success: false,
        message: 'Account is suspended. Contact support.' 
      });
    }

    // ✅ FIX 3: Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'xoss-gaming-default-secret-2024',
      { expiresIn: '7d' }
    );

    // ✅ FIX 4: Prepare response (Backward compatible)
    const responseUser = {
      _id: user._id,
      id: user._id,
      email: user.email,
      username: user.username || user.email.split('@')[0],
      phone: user.phone || '',
      name: user.name || '',
      avatar: user.avatar || 'https://res.cloudinary.com/xoss/image/upload/v1/default_avatar.png',
      role: user.role || 'user',
      
      // Wallet balance (all possible fields)
      wallet_balance: user.wallet_balance || user.balance || user.wallet?.balance || 0,
      wallet: {
        balance: user.wallet_balance || user.balance || user.wallet?.balance || 0,
        total_earned: user.total_earnings || user.wallet?.total_earned || 0
      },
      
      // Level (all possible fields)
      level: user.level || user.progression?.current || 1,
      experience: user.experience || user.progression?.experience || 0,
      progression: {
        current: user.level || user.progression?.current || 1,
        experience: user.experience || user.progression?.experience || 0
      },
      
      // Stats
      matches_played: user.matches_played || user.stats?.matches_played || 0,
      matches_won: user.matches_won || user.stats?.matches_won || 0,
      
      // Account status
      is_verified: user.is_verified || false,
      is_active: user.is_active !== false,
      account_status: user.account_status || 'active',
      
      // Timestamps
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date()
    };

    console.log('✅ LOGIN SUCCESS:', {
      email: user.email,
      userId: user._id,
      walletBalance: responseUser.wallet_balance,
      level: responseUser.level
    });

    // Success response
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: responseUser
    });

  } catch (error) {
    console.error('🔥 LOGIN PROCESS ERROR:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ SIMPLE REGISTER ROUTE (যদি নতুন ইউজার করতে চান)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }
    
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const db = mongoose.connection.db;
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const newUser = {
      username: username || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      wallet_balance: 1000,
      level: 1,
      experience: 0,
      matches_played: 0,
      matches_won: 0,
      is_verified: false,
      is_active: true,
      account_status: 'active',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    // Generate token
    const token = jwt.sign(
      { userId: result.insertedId },
      process.env.JWT_SECRET || 'xoss-gaming-default-secret-2024',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: result.insertedId,
        ...newUser,
        password: undefined // Remove password from response
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed' 
    });
  }
});

module.exports = router;
