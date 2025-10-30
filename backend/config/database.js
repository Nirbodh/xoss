const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // ✅ Recommended options (some are now defaults, but safe to include)
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Event listeners
    mongoose.connection.on('connected', () => {
      console.log('🎯 Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from DB');
    });

  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
