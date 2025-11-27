// scripts/addResultFields.js - NEW MIGRATION
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🚀 Adding result calculation fields to database...');

const migrateDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');

    // Add results field to matches
    const matchResult = await Match.updateMany(
      { results: { $exists: false } },
      { 
        $set: { 
          results: [],
          calculatedWinners: [],
          resultStatus: 'pending'
        } 
      }
    );
    console.log(`✅ Updated ${matchResult.modifiedCount} matches with result fields`);

    // Add results field to tournaments
    const tournamentResult = await Tournament.updateMany(
      { results: { $exists: false } },
      { 
        $set: { 
          results: [],
          calculatedWinners: [],
          resultStatus: 'pending'
        } 
      }
    );
    console.log(`✅ Updated ${tournamentResult.modifiedCount} tournaments with result fields`);

    console.log('🎉 Result system migration completed!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateDatabase();
