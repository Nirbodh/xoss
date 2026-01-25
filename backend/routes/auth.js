const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  console.log('🔐 LOGIN REQUEST RECEIVED:', { 
    email: req.body.email,
    timestamp: new Date().toISOString() 
  });

  try {
    const { email, password } = req.body;

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
    const user = await db.collection('users').findOne({
      email: email.toLowerCase().trim()
    });

    console.log('🔍 DATABASE RESULT:', {
      found: !!user,
      email: user?.email,
      hasPassword: !!user?.password,
      userId: user?._id
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    if (!user.password) {
      console.log('⚠️ USER HAS NO PASSWORD IN DB:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Account setup incomplete. Please reset password.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔐 PASSWORD COMPARISON:', { match: isMatch });

    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    if (user.is_active === false || user.account_status === 'suspended') {
      return res.status(403).json({ 
        success: false,
        message: 'Account is suspended. Contact support.' 
      });
    }

    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'xoss-gaming-default-secret-2024',
      { expiresIn: '7d' }
    );

    let responseUser;
    
    try {
      const userModel = new User(user);
      responseUser = userModel.getFormattedUser ? userModel.getFormattedUser() : formatUserResponse(user);
    } catch (error) {
      console.log('⚠️ Using fallback user formatting:', error.message);
      responseUser = formatUserResponse(user);
    }

    console.log('✅ LOGIN SUCCESS:', {
      email: user.email,
      userId: user._id,
      walletBalance: responseUser.wallet_balance,
      level: responseUser.level
    });

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

function formatUserResponse(user) {
  let walletBalance = 0;
  if (user.wallet?.balance !== undefined) {
    walletBalance = user.wallet.balance;
  } else if (user.wallet_balance !== undefined) {
    walletBalance = user.wallet_balance;
  } else if (user.balance !== undefined) {
    walletBalance = user.balance;
  }
  
  let level = 1;
  if (user.progression?.current !== undefined) {
    level = user.progression.current;
  } else if (user.level !== undefined) {
    level = user.level;
  }
  
  let experience = 0;
  if (user.progression?.experience !== undefined) {
    experience = user.progression.experience;
  } else if (user.experience !== undefined) {
    experience = user.experience;
  }
  
  let matchesPlayed = 0;
  if (user.stats?.matches_played !== undefined) {
    matchesPlayed = user.stats.matches_played;
  } else if (user.matches_played !== undefined) {
    matchesPlayed = user.matches_played;
  }
  
  let matchesWon = 0;
  if (user.stats?.matches_won !== undefined) {
    matchesWon = user.stats.matches_won;
  } else if (user.matches_won !== undefined) {
    matchesWon = user.matches_won;
  }
  
  return {
    _id: user._id,
    id: user._id,
    email: user.email,
    username: user.username || user.email.split('@')[0],
    phone: user.phone || '',
    name: user.name || '',
    avatar: user.avatar || 'https://res.cloudinary.com/xoss/image/upload/v1/default_avatar.png',
    role: user.role || 'user',
    
    wallet_balance: walletBalance,
    wallet: {
      balance: walletBalance,
      total_earned: user.wallet?.total_earned || user.total_earnings || 0,
      total_deposited: user.wallet?.total_deposited || 0,
      total_withdrawn: user.wallet?.total_withdrawn || 0,
      total_won: user.wallet?.total_won || 0,
      total_lost: user.wallet?.total_lost || 0
    },
    
    level: level,
    experience: experience,
    progression: {
      current: level,
      experience: experience,
      next_level_xp: user.progression?.next_level_xp || 1000,
      badges: user.progression?.badges || [],
      achievements: user.progression?.achievements || []
    },
    
    matches_played: matchesPlayed,
    matches_won: matchesWon,
    stats: {
      matches_played: matchesPlayed,
      matches_won: matchesWon,
      matches_lost: user.stats?.matches_lost || 0,
      win_rate: user.stats?.win_rate || 0,
      rank_score: user.stats?.rank_score || 1000,
      highest_rank: user.stats?.highest_rank || 'Bronze V'
    },
    
    favorite_game: user.gaming?.favorite_game || user.favorite_game || 'Free Fire',
    gaming: user.gaming || {
      favorite_game: user.favorite_game || 'Free Fire',
      favorite_mode: 'Ranked',
      preferred_device: 'mobile',
      play_style: 'balanced',
      squad_preference: 'squad'
    },
    
    is_verified: user.is_verified || user.verification?.email_verified || false,
    is_active: user.is_active !== false,
    account_status: user.account_status || 'active',
    
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
    last_active: user.metadata?.last_active || new Date()
  };
}

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
    
    const existingUser = await db.collection('users').findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = {
      username: username || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      wallet_balance: 1000,
      wallet: {
        balance: 1000,
        total_deposited: 0,
        total_withdrawn: 0,
        total_earned: 0
      },
      level: 1,
      progression: {
        current: 1,
        experience: 0,
        next_level_xp: 1000
      },
      experience: 0,
      matches_played: 0,
      matches_won: 0,
      stats: {
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        win_rate: 0,
        rank_score: 1000,
        highest_rank: 'Bronze V'
      },
      is_verified: false,
      is_active: true,
      account_status: 'active',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    const token = jwt.sign(
      { userId: result.insertedId },
      process.env.JWT_SECRET || 'xoss-gaming-default-secret-2024',
      { expiresIn: '7d' }
    );
    
    const responseUser = formatUserResponse({
      ...newUser,
      _id: result.insertedId
    });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: responseUser
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
