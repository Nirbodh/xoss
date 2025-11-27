// scripts/addWinnersField.js - Database migrate korar jonno
const mongoose = require('mongoose');
require('dotenv').config();

const migrateDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for migration');

    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');

    // Add winners field to existing matches
    const matchResult = await Match.updateMany(
      { winners: { $exists: false } },
      { 
        $set: { 
          winners: [],
          prizeStatus: 'pending'
        } 
      }
    );
    console.log(`✅ Updated ${matchResult.modifiedCount} matches`);

    // Add winners field to existing tournaments  
    const tournamentResult = await Tournament.updateMany(
      { winners: { $exists: false } },
      { 
        $set: { 
          winners: [],
          prizeStatus: 'pending'
        } 
      }
    );
    console.log(`✅ Updated ${tournamentResult.modifiedCount} tournaments`);

    console.log('🎉 Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateDatabase();
