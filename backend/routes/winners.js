// routes/winners.js - XOSS Gaming Winners Management
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const { Wallet } = require('../models/Wallet');
const User = require('../models/User');

// Get all winners (public)
router.get('/', async (req, res) => {
  try {
    const { limit = 20, page = 1, game, type, date } = req.query;
    const skip = (page - 1) * limit;

    let matchFilter = {
      status: 'completed',
      'winners.0': { $exists: true }
    };

    let tournamentFilter = {
      status: 'completed',
      'winners.0': { $exists: true }
    };

    if (game) {
      matchFilter.game = game;
      tournamentFilter.game = game;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      matchFilter.completed_at = { $gte: startDate, $lt: endDate };
      tournamentFilter.completed_at = { $gte: startDate, $lt: endDate };
    }

    const [matches, tournaments] = await Promise.all([
      Match.find(matchFilter)
        .select('title game completed_at winners prize_distribution')
        .populate('winners.user', 'username avatar')
        .sort({ completed_at: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Tournament.find(tournamentFilter)
        .select('title game completed_at winners prize_distribution')
        .populate('winners.user', 'username avatar')
        .sort({ completed_at: -1 })
        .skip(skip)
        .limit(Number(limit))
    ]);

    // Combine and format winners
    const allWinners = [];

    matches.forEach(match => {
      match.winners.forEach(winner => {
        allWinners.push({
          event_id: match._id,
          event_type: 'match',
          event_title: match.title,
          game: match.game,
          user_id: winner.user?._id,
          username: winner.user?.username || winner.username,
          avatar: winner.user?.avatar,
          rank: winner.rank,
          prize_amount: winner.prize_amount,
          total_prize: winner.total_prize || winner.prize_amount,
          date: match.completed_at || match.end_time,
          formatted_date: match.completed_at ? 
            match.completed_at.toLocaleDateString('bn-BD') : 
            match.end_time.toLocaleDateString('bn-BD')
        });
      });
    });

    tournaments.forEach(tournament => {
      tournament.winners.forEach(winner => {
        allWinners.push({
          event_id: tournament._id,
          event_type: 'tournament',
          event_title: tournament.title,
          game: tournament.game,
          user_id: winner.user?._id,
          username: winner.user?.username || winner.username,
          avatar: winner.user?.avatar,
          rank: winner.rank,
          prize_amount: winner.prize_amount,
          total_prize: winner.total_prize || winner.prize_amount,
          date: tournament.completed_at || tournament.end_time,
          formatted_date: tournament.completed_at ? 
            tournament.completed_at.toLocaleDateString('bn-BD') : 
            tournament.end_time.toLocaleDateString('bn-BD')
        });
      });
    });

    // Sort by date (most recent first)
    allWinners.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get top winners by total prize
    const topWinners = [...allWinners]
      .sort((a, b) => b.prize_amount - a.prize_amount)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        winners: allWinners.slice(0, limit),
        top_winners: topWinners,
        stats: {
          total_winners: allWinners.length,
          total_prize_distributed: allWinners.reduce((sum, w) => sum + w.prize_amount, 0),
          average_prize: allWinners.length > 0 ? 
            allWinners.reduce((sum, w) => sum + w.prize_amount, 0) / allWinners.length : 0
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: allWinners.length,
          pages: Math.ceil(allWinners.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Get winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch winners',
      error: error.message
    });
  }
});

// Get winners by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const [matchWins, tournamentWins] = await Promise.all([
      Match.find({
        status: 'completed',
        'winners.user': userId
      })
        .select('title game completed_at winners')
        .sort({ completed_at: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Tournament.find({
        status: 'completed',
        'winners.user': userId
      })
        .select('title game completed_at winners')
        .sort({ completed_at: -1 })
        .skip(skip)
        .limit(Number(limit))
    ]);

    const userWins = [];

    matchWins.forEach(match => {
      const winner = match.winners.find(w => w.user.toString() === userId);
      if (winner) {
        userWins.push({
          event_id: match._id,
          event_type: 'match',
          event_title: match.title,
          game: match.game,
          rank: winner.rank,
          prize_amount: winner.prize_amount,
          total_prize: winner.total_prize || winner.prize_amount,
          date: match.completed_at || match.end_time,
          formatted_date: match.completed_at ? 
            match.completed_at.toLocaleDateString('bn-BD') : 
            match.end_time.toLocaleDateString('bn-BD')
        });
      }
    });

    tournamentWins.forEach(tournament => {
      const winner = tournament.winners.find(w => w.user.toString() === userId);
      if (winner) {
        userWins.push({
          event_id: tournament._id,
          event_type: 'tournament',
          event_title: tournament.title,
          game: tournament.game,
          rank: winner.rank,
          prize_amount: winner.prize_amount,
          total_prize: winner.total_prize || winner.prize_amount,
          date: tournament.completed_at || tournament.end_time,
          formatted_date: tournament.completed_at ? 
            tournament.completed_at.toLocaleDateString('bn-BD') : 
            tournament.end_time.toLocaleDateString('bn-BD')
        });
      }
    });

    // Sort by date (most recent first)
    userWins.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate user stats
    const totalWins = userWins.length;
    const totalPrize = userWins.reduce((sum, win) => sum + win.prize_amount, 0);
    const averagePrize = totalWins > 0 ? totalPrize / totalWins : 0;
    const firstWin = userWins[userWins.length - 1];
    const latestWin = userWins[0];

    // Get user info
    const user = await User.findById(userId).select('username avatar stats');

    res.json({
      success: true,
      data: {
        user: {
          id: user?._id,
          username: user?.username,
          avatar: user?.avatar
        },
        wins: userWins,
        stats: {
          total_wins: totalWins,
          total_prize: totalPrize,
          formatted_total_prize: new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
          }).format(totalPrize),
          average_prize: averagePrize,
          first_win: firstWin,
          latest_win: latestWin,
          win_rate: user?.stats?.win_rate || 0
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalWins,
          pages: Math.ceil(totalWins / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Get user winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user wins',
      error: error.message
    });
  }
});

// Get winner details by event
router.get('/event/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Try to find in matches
    let event = await Match.findById(eventId)
      .select('title game type completed_at winners prize_distribution total_prize')
      .populate('winners.user', 'username avatar email phone');

    let eventType = 'match';

    // If not found in matches, try tournaments
    if (!event) {
      event = await Tournament.findById(eventId)
        .select('title game type completed_at winners prize_distribution total_prize')
        .populate('winners.user', 'username avatar email phone');
      eventType = 'tournament';
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Format winners data
    const formattedWinners = event.winners.map(winner => ({
      rank: winner.rank,
      user: winner.user ? {
        id: winner.user._id,
        username: winner.user.username,
        avatar: winner.user.avatar,
        email: winner.user.email,
        phone: winner.user.phone
      } : {
        id: winner.user,
        username: winner.username
      },
      kills: winner.kills || 0,
      damage: winner.damage || 0,
      prize_amount: winner.prize_amount,
      total_prize: winner.total_prize || winner.prize_amount,
      payment_status: winner.payment_status,
      formatted_prize: new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 2
      }).format(winner.prize_amount)
    }));

    res.json({
      success: true,
      data: {
        event: {
          id: event._id,
          type: eventType,
          title: event.title,
          game: event.game,
          match_type: event.type,
          completed_at: event.completed_at || event.end_time,
          total_prize: event.total_prize,
          formatted_total_prize: new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
          }).format(event.total_prize),
          prize_distribution: event.prize_distribution
        },
        winners: formattedWinners,
        summary: {
          total_winners: event.winners.length,
          total_prize_distributed: event.winners.reduce((sum, w) => sum + w.prize_amount, 0),
          highest_prize: Math.max(...event.winners.map(w => w.prize_amount)),
          lowest_prize: Math.min(...event.winners.map(w => w.prize_amount))
        }
      }
    });
  } catch (error) {
    console.error('❌ Get event winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event winners',
      error: error.message
    });
  }
});

// Get today's winners
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayMatches, todayTournaments] = await Promise.all([
      Match.find({
        status: 'completed',
        completed_at: { $gte: today, $lt: tomorrow },
        'winners.0': { $exists: true }
      })
        .select('title game completed_at winners')
        .populate('winners.user', 'username avatar')
        .sort({ completed_at: -1 }),
      Tournament.find({
        status: 'completed',
        completed_at: { $gte: today, $lt: tomorrow },
        'winners.0': { $exists: true }
      })
        .select('title game completed_at winners')
        .populate('winners.user', 'username avatar')
        .sort({ completed_at: -1 })
    ]);

    const todayWinners = [];

    todayMatches.forEach(match => {
      match.winners.forEach(winner => {
        todayWinners.push({
          event_id: match._id,
          event_type: 'match',
          event_title: match.title,
          game: match.game,
          user_id: winner.user?._id,
          username: winner.user?.username || winner.username,
          avatar: winner.user?.avatar,
          rank: winner.rank,
          prize_amount: winner.prize_amount
        });
      });
    });

    todayTournaments.forEach(tournament => {
      tournament.winners.forEach(winner => {
        todayWinners.push({
          event_id: tournament._id,
          event_type: 'tournament',
          event_title: tournament.title,
          game: tournament.game,
          user_id: winner.user?._id,
          username: winner.user?.username || winner.username,
          avatar: winner.user?.avatar,
          rank: winner.rank,
          prize_amount: winner.prize_amount
        });
      });
    });

    // Sort by prize amount (highest first)
    todayWinners.sort((a, b) => b.prize_amount - a.prize_amount);

    const totalPrizeToday = todayWinners.reduce((sum, w) => sum + w.prize_amount, 0);
    const eventCount = [...todayMatches, ...todayTournaments].length;

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        formatted_date: today.toLocaleDateString('bn-BD'),
        winners: todayWinners,
        stats: {
          total_winners: todayWinners.length,
          total_events: eventCount,
          total_prize: totalPrizeToday,
          formatted_total_prize: new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
          }).format(totalPrizeToday),
          average_prize: todayWinners.length > 0 ? 
            totalPrizeToday / todayWinners.length : 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Get today winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today winners',
      error: error.message
    });
  }
});

// Get top winners of all time
router.get('/top/all-time', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Aggregation to get top winners by total prize
    const topWinners = await User.aggregate([
      {
        $lookup: {
          from: 'matches',
          localField: '_id',
          foreignField: 'winners.user',
          as: 'match_wins'
        }
      },
      {
        $lookup: {
          from: 'tournaments',
          localField: '_id',
          foreignField: 'winners.user',
          as: 'tournament_wins'
        }
      },
      {
        $project: {
          username: 1,
          avatar: 1,
          email: 1,
          total_prize_won: {
            $add: [
              {
                $sum: '$match_wins.winners.prize_amount'
              },
              {
                $sum: '$tournament_wins.winners.prize_amount'
              }
            ]
          },
          total_wins: {
            $add: [
              { $size: '$match_wins' },
              { $size: '$tournament_wins' }
            ]
          },
          match_wins: { $size: '$match_wins' },
          tournament_wins: { $size: '$tournament_wins' }
        }
      },
      {
        $match: {
          total_wins: { $gt: 0 }
        }
      },
      {
        $sort: { total_prize_won: -1 }
      },
      {
        $limit: Number(limit)
      }
    ]);

    // Format the data
    const formattedTopWinners = topWinners.map(winner => ({
      user_id: winner._id,
      username: winner.username,
      avatar: winner.avatar,
      email: winner.email,
      total_prize_won: winner.total_prize_won,
      formatted_total_prize: new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 2
      }).format(winner.total_prize_won),
      total_wins: winner.total_wins,
      match_wins: winner.match_wins,
      tournament_wins: winner.tournament_wins,
      average_prize_per_win: winner.total_wins > 0 ? 
        winner.total_prize_won / winner.total_wins : 0
    }));

    res.json({
      success: true,
      data: {
        top_winners: formattedTopWinners,
        summary: {
          total_top_winners: formattedTopWinners.length,
          total_prize_all_time: formattedTopWinners.reduce((sum, w) => sum + w.total_prize_won, 0),
          average_prize_all_time: formattedTopWinners.length > 0 ?
            formattedTopWinners.reduce((sum, w) => sum + w.total_prize_won, 0) / formattedTopWinners.length : 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Get top winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top winners',
      error: error.message
    });
  }
});

// Admin: Mark prize as paid
router.post('/admin/:eventId/mark-paid/:winnerId', adminAuth, async (req, res) => {
  try {
    const { eventId, winnerId } = req.params;
    const { payment_method, transaction_id, notes } = req.body;

    // Try matches first
    let event = await Match.findById(eventId);
    let eventType = 'match';

    if (!event) {
      event = await Tournament.findById(eventId);
      eventType = 'tournament';
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Find the winner
    const winnerIndex = event.winners.findIndex(w => 
      w._id.toString() === winnerId
    );

    if (winnerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Winner not found in this event'
      });
    }

    // Update winner payment status
    event.winners[winnerIndex].payment_status = 'paid';
    event.winners[winnerIndex].payment_method = payment_method || 'manual';
    event.winners[winnerIndex].transaction_id = transaction_id || `MANUAL_${Date.now()}`;
    event.winners[winnerIndex].paid_at = new Date();
    event.winners[winnerIndex].notes = notes || '';

    // If all winners are paid, update event prize status
    const allPaid = event.winners.every(w => w.payment_status === 'paid');
    if (allPaid) {
      event.prize_status = 'distributed';
      event.distribution_date = new Date();
      event.distributed_by = req.user.userId;
    }

    await event.save();

    // Credit winner's wallet
    try {
      const wallet = await Wallet.findOrCreate(event.winners[winnerIndex].user);
      await wallet.credit(event.winners[winnerIndex].prize_amount, {
        type: `${eventType}_win`,
        description: `Prize for ${event.title} - Rank ${event.winners[winnerIndex].rank}`,
        metadata: {
          event_id: eventId,
          event_type: eventType,
          rank: event.winners[winnerIndex].rank,
          admin_id: req.user.userId
        }
      });
    } catch (walletError) {
      console.error('❌ Wallet credit error:', walletError);
      // Don't fail the whole request if wallet credit fails
    }

    res.json({
      success: true,
      message: 'Prize marked as paid successfully',
      data: {
        event_id: eventId,
        event_type: eventType,
        event_title: event.title,
        winner: event.winners[winnerIndex],
        payment_details: {
          payment_method: payment_method || 'manual',
          transaction_id: transaction_id || `MANUAL_${Date.now()}`,
          paid_at: new Date(),
          paid_by: req.user.userId
        }
      }
    });
  } catch (error) {
    console.error('❌ Mark prize as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark prize as paid',
      error: error.message
    });
  }
});

// Admin: Bulk mark prizes as paid
router.post('/admin/bulk-pay', adminAuth, async (req, res) => {
  try {
    const { winners } = req.body; // Array of { eventId, winnerId, payment_method, transaction_id }

    if (!Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Winners array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const winnerData of winners) {
      try {
        const { eventId, winnerId, payment_method, transaction_id } = winnerData;

        // Try matches first
        let event = await Match.findById(eventId);
        let eventType = 'match';

        if (!event) {
          event = await Tournament.findById(eventId);
          eventType = 'tournament';
        }

        if (!event) {
          errors.push({ eventId, winnerId, error: 'Event not found' });
          continue;
        }

        // Find the winner
        const winnerIndex = event.winners.findIndex(w => 
          w._id.toString() === winnerId
        );

        if (winnerIndex === -1) {
          errors.push({ eventId, winnerId, error: 'Winner not found' });
          continue;
        }

        // Check if already paid
        if (event.winners[winnerIndex].payment_status === 'paid') {
          results.push({
            eventId,
            winnerId,
            status: 'skipped',
            reason: 'Already paid'
          });
          continue;
        }

        // Update winner payment status
        event.winners[winnerIndex].payment_status = 'paid';
        event.winners[winnerIndex].payment_method = payment_method || 'manual';
        event.winners[winnerIndex].transaction_id = transaction_id || `BULK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        event.winners[winnerIndex].paid_at = new Date();
        event.winners[winnerIndex].notes = 'Bulk payment';

        await event.save();

        // Credit winner's wallet
        try {
          const wallet = await Wallet.findOrCreate(event.winners[winnerIndex].user);
          await wallet.credit(event.winners[winnerIndex].prize_amount, {
            type: `${eventType}_win`,
            description: `Bulk prize payment for ${event.title}`,
            metadata: {
              event_id: eventId,
              event_type: eventType,
              admin_id: req.user.userId,
              bulk_payment: true
            }
          });
        } catch (walletError) {
          console.error('❌ Wallet credit error in bulk:', walletError);
        }

        results.push({
          eventId,
          winnerId,
          status: 'paid',
          prize_amount: event.winners[winnerIndex].prize_amount,
          payment_method: payment_method || 'manual',
          transaction_id: event.winners[winnerIndex].transaction_id
        });

      } catch (error) {
        errors.push({
          eventId: winnerData.eventId,
          winnerId: winnerData.winnerId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk payment processed',
      data: {
        processed: results.length,
        succeeded: results.filter(r => r.status === 'paid').length,
        failed: errors.length,
        skipped: results.filter(r => r.status === 'skipped').length,
        results: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('❌ Bulk payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk payment',
      error: error.message
    });
  }
});

// Export winners data (admin only)
router.get('/admin/export', adminAuth, async (req, res) => {
  try {
    const { start_date, end_date, format = 'json' } = req.query;

    const filter = {
      status: 'completed',
      'winners.0': { $exists: true }
    };

    if (start_date || end_date) {
      filter.completed_at = {};
      if (start_date) filter.completed_at.$gte = new Date(start_date);
      if (end_date) filter.completed_at.$lte = new Date(end_date);
    }

    const [matches, tournaments] = await Promise.all([
      Match.find(filter)
        .populate('winners.user', 'username email phone')
        .populate('created_by', 'username'),
      Tournament.find(filter)
        .populate('winners.user', 'username email phone')
        .populate('created_by', 'username')
    ]);

    // Combine all winners data
    const allWinners = [];

    matches.forEach(match => {
      match.winners.forEach(winner => {
        allWinners.push({
          event_id: match._id,
          event_type: 'match',
          event_title: match.title,
          game: match.game,
          event_date: match.completed_at || match.end_time,
          created_by: match.created_by?.username || 'System',
          winner_id: winner.user?._id,
          winner_username: winner.user?.username || winner.username,
          winner_email: winner.user?.email,
          winner_phone: winner.user?.phone,
          rank: winner.rank,
          kills: winner.kills || 0,
          damage: winner.damage || 0,
          prize_amount: winner.prize_amount,
          total_prize: winner.total_prize || winner.prize_amount,
          payment_status: winner.payment_status,
          payment_method: winner.payment_method,
          transaction_id: winner.transaction_id,
          paid_at: winner.paid_at
        });
      });
    });

    tournaments.forEach(tournament => {
      tournament.winners.forEach(winner => {
        allWinners.push({
          event_id: tournament._id,
          event_type: 'tournament',
          event_title: tournament.title,
          game: tournament.game,
          event_date: tournament.completed_at || tournament.end_time,
          created_by: tournament.created_by?.username || 'System',
          winner_id: winner.user?._id,
          winner_username: winner.user?.username || winner.username,
          winner_email: winner.user?.email,
          winner_phone: winner.user?.phone,
          rank: winner.rank,
          kills: winner.kills || 0,
          damage: winner.damage || 0,
          prize_amount: winner.prize_amount,
          total_prize: winner.total_prize || winner.prize_amount,
          payment_status: winner.payment_status,
          payment_method: winner.payment_method,
          transaction_id: winner.transaction_id,
          paid_at: winner.paid_at
        });
      });
    });

    // Sort by date
    allWinners.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

    // Calculate summary
    const summary = {
      total_events: matches.length + tournaments.length,
      total_winners: allWinners.length,
      total_prize_distributed: allWinners.reduce((sum, w) => sum + w.prize_amount, 0),
      paid_winners: allWinners.filter(w => w.payment_status === 'paid').length,
      pending_winners: allWinners.filter(w => w.payment_status === 'pending').length,
      date_range: {
        start: start_date || 'Beginning',
        end: end_date || 'Now'
      },
      exported_at: new Date().toISOString(),
      exported_by: req.user.username
    };

    if (format === 'csv') {
      // Convert to CSV
      const csvData = convertToCSV(allWinners, summary);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="winners_export_${Date.now()}.csv"`);
      return res.send(csvData);
    }

    // Default JSON response
    res.json({
      success: true,
      data: {
        summary,
        winners: allWinners
      },
      export_info: {
        format: 'json',
        exported_at: new Date().toISOString(),
        total_records: allWinners.length
      }
    });

  } catch (error) {
    console.error('❌ Export winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export winners data',
      error: error.message
    });
  }
});

// Helper function to convert to CSV
function convertToCSV(data, summary) {
  const headers = [
    'Event ID', 'Event Type', 'Event Title', 'Game', 'Event Date',
    'Created By', 'Winner ID', 'Winner Username', 'Winner Email', 'Winner Phone',
    'Rank', 'Kills', 'Damage', 'Prize Amount', 'Total Prize', 
    'Payment Status', 'Payment Method', 'Transaction ID', 'Paid At'
  ];

  const rows = data.map(item => [
    item.event_id,
    item.event_type,
    `"${item.event_title}"`,
    item.game,
    new Date(item.event_date).toISOString(),
    item.created_by,
    item.winner_id,
    item.winner_username,
    item.winner_email || '',
    item.winner_phone || '',
    item.rank,
    item.kills,
    item.damage,
    item.prize_amount,
    item.total_prize,
    item.payment_status,
    item.payment_method || '',
    item.transaction_id || '',
    item.paid_at ? new Date(item.paid_at).toISOString() : ''
  ]);

  // Add summary as comments at the beginning
  const summaryText = `# Winners Export Summary
# Total Events: ${summary.total_events}
# Total Winners: ${summary.total_winners}
# Total Prize Distributed: ${summary.total_prize_distributed}
# Paid Winners: ${summary.paid_winners}
# Pending Winners: ${summary.pending_winners}
# Date Range: ${summary.date_range.start} to ${summary.date_range.end}
# Exported At: ${summary.exported_at}
# Exported By: ${summary.exported_by}
\n`;

  const csvContent = [
    summaryText,
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

// Get prize distribution statistics
router.get('/stats/prize-distribution', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [matchStats, tournamentStats] = await Promise.all([
      Match.aggregate([
        {
          $match: {
            status: 'completed',
            completed_at: { $gte: startDate },
            'winners.0': { $exists: true }
          }
        },
        {
          $unwind: '$winners'
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$completed_at' } },
              game: '$game'
            },
            total_prize: { $sum: '$winners.prize_amount' },
            total_winners: { $sum: 1 },
            average_prize: { $avg: '$winners.prize_amount' }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]),
      Tournament.aggregate([
        {
          $match: {
            status: 'completed',
            completed_at: { $gte: startDate },
            'winners.0': { $exists: true }
          }
        },
        {
          $unwind: '$winners'
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$completed_at' } },
              game: '$game'
            },
            total_prize: { $sum: '$winners.prize_amount' },
            total_winners: { $sum: 1 },
            average_prize: { $avg: '$winners.prize_amount' }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ])
    ]);

    // Combine and format stats
    const dailyStats = {};
    
    [...matchStats, ...tournamentStats].forEach(stat => {
      const date = stat._id.date;
      const game = stat._id.game;
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          total_prize: 0,
          total_winners: 0,
          by_game: {}
        };
      }
      
      dailyStats[date].total_prize += stat.total_prize;
      dailyStats[date].total_winners += stat.total_winners;
      
      if (!dailyStats[date].by_game[game]) {
        dailyStats[date].by_game[game] = {
          total_prize: 0,
          total_winners: 0
        };
      }
      
      dailyStats[date].by_game[game].total_prize += stat.total_prize;
      dailyStats[date].by_game[game].total_winners += stat.total_winners;
    });

    const formattedStats = Object.values(dailyStats)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(stat => ({
        ...stat,
        formatted_date: new Date(stat.date).toLocaleDateString('bn-BD'),
        formatted_total_prize: new Intl.NumberFormat('en-BD', {
          style: 'currency',
          currency: 'BDT',
          minimumFractionDigits: 2
        }).format(stat.total_prize)
      }));

    // Calculate overall statistics
    const totalPrize = formattedStats.reduce((sum, stat) => sum + stat.total_prize, 0);
    const totalWinners = formattedStats.reduce((sum, stat) => sum + stat.total_winners, 0);
    const averagePrizePerDay = formattedStats.length > 0 ? totalPrize / formattedStats.length : 0;
    const averageWinnersPerDay = formattedStats.length > 0 ? totalWinners / formattedStats.length : 0;

    res.json({
      success: true,
      data: {
        period: {
          days: parseInt(days),
          start_date: startDate.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        },
        daily_stats: formattedStats,
        summary: {
          total_prize_distributed: totalPrize,
          formatted_total_prize: new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
          }).format(totalPrize),
          total_winners: totalWinners,
          average_prize_per_day: averagePrizePerDay,
          average_winners_per_day: averageWinnersPerDay,
          average_prize_per_winner: totalWinners > 0 ? totalPrize / totalWinners : 0
        },
        by_game: getGameStats(formattedStats)
      }
    });

  } catch (error) {
    console.error('❌ Prize distribution stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prize distribution statistics',
      error: error.message
    });
  }
});

// Helper function to get game-wise statistics
function getGameStats(dailyStats) {
  const gameStats = {};
  
  dailyStats.forEach(stat => {
    Object.entries(stat.by_game).forEach(([game, data]) => {
      if (!gameStats[game]) {
        gameStats[game] = {
          total_prize: 0,
          total_winners: 0,
          days_with_events: 0
        };
      }
      
      gameStats[game].total_prize += data.total_prize;
      gameStats[game].total_winners += data.total_winners;
      gameStats[game].days_with_events++;
    });
  });
  
  // Convert to array and add formatted values
  return Object.entries(gameStats).map(([game, stats]) => ({
    game,
    ...stats,
    formatted_total_prize: new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2
    }).format(stats.total_prize),
    average_prize_per_winner: stats.total_winners > 0 ? 
      stats.total_prize / stats.total_winners : 0,
    percentage_of_total: stats.total_prize > 0 ? 
      (stats.total_prize / dailyStats.reduce((sum, stat) => sum + stat.total_prize, 0)) * 100 : 0
  })).sort((a, b) => b.total_prize - a.total_prize);
}

module.exports = router;
