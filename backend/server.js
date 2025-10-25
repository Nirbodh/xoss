const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database'); // ADD THIS LINE

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection - UPDATED
connectDB(); // REPLACE THE DIRECT MONGOOSE CONNECT WITH THIS

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: '🚀 XOSS Gaming Backend is Running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Home route
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: '🎮 Welcome to XOSS Gaming Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tournaments: '/api/tournaments',
      matches: '/api/matches',
      wallet: '/api/wallet',
      notifications: '/api/notifications',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`⭐ XOSS Backend Server Started`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🕒 Time: ${new Date().toLocaleString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: MongoDB Atlas`);
  console.log(`🚀 Status: Running successfully!`);
});
