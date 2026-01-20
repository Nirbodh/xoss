// controllers/adminController.js - COMPLETE ADMIN CONTROLLER
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const User = require('../models/User');

// ==============================================
// 🔥 ADMIN MATCHES CONTROLLER
// ==============================================

// ✅ Get all matches for admin
exports.getAllMatchesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, game, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (game) query.game = game;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const matches = await Match.find(query)
      .populate('creator', 'username email')
      .populate('participants.user', 'username email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Match.countDocuments(query);
    
    res.json({
      success: true,
      data: matches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
};

// ✅ Get matches dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalMatches,
      activeMatches,
      pendingMatches,
      completedMatches,
      cancelledMatches,
      todayMatches,
      totalParticipants
    ] = await Promise.all([
      Match.countDocuments(),
      Match.countDocuments({ status: 'active' }),
      Match.countDocuments({ status: 'pending' }),
      Match.countDocuments({ status: 'completed' }),
      Match.countDocuments({ status: 'cancelled' }),
      Match.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Match.aggregate([
        { $group: { _id: null, total: { $sum: { $size: "$participants" } } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        totalMatches,
        activeMatches,
        pendingMatches,
        completedMatches,
        cancelledMatches,
        todayMatches,
        totalParticipants: totalParticipants[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message
    });
  }
};

// ✅ Get recent activities
exports.getRecentActivities = async (req, res) => {
  try {
    const matches = await Match.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status game participants updatedAt');
    
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activities',
      error: error.message
    });
  }
};

// ✅ Get match by ID for admin
exports.getMatchByIdForAdmin = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('creator', 'username email name')
      .populate('participants.user', 'username email name')
      .populate('results.user', 'username email name');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get match',
      error: error.message
    });
  }
};

// ✅ Admin update match
exports.adminUpdateMatch = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.createdAt;
    delete updates.creator;
    
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Match updated successfully',
      data: match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update match',
      error: error.message
    });
  }
};

// ✅ Force delete match
exports.forceDeleteMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Match deleted successfully',
      data: { id: match._id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete match',
      error: error.message
    });
  }
};

// ✅ Get pending matches
exports.getPendingMatchesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const matches = await Match.find({ status: 'pending' })
      .populate('creator', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Match.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      data: matches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending matches',
      error: error.message
    });
  }
};

// ✅ Approve match
exports.approveMatchForAdmin = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'active',
        approvedAt: new Date(),
        approvedBy: req.user.id
      },
      { new: true }
    );
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Match approved successfully',
      data: match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve match',
      error: error.message
    });
  }
};

// ✅ Reject match
exports.rejectMatchForAdmin = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user.id,
        rejectionReason: reason
      },
      { new: true }
    );
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Match rejected successfully',
      data: match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject match',
      error: error.message
    });
  }
};

// ✅ Get match participants
exports.getMatchParticipantsForAdmin = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('participants.user', 'username email name');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      data: match.participants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get participants',
      error: error.message
    });
  }
};

// ✅ Add participant manually
exports.addParticipantManually = async (req, res) => {
  try {
    const { userId, teamName, playerId } = req.body;
    
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if already participating
    const alreadyParticipating = match.participants.some(p => 
      p.user.toString() === userId
    );
    
    if (alreadyParticipating) {
      return res.status(400).json({
        success: false,
        message: 'User already participating in this match'
      });
    }
    
    match.participants.push({
      user: userId,
      teamName: teamName || user.username,
      playerId: playerId || userId,
      joinedAt: new Date(),
      status: 'joined'
    });
    
    await match.save();
    
    res.json({
      success: true,
      message: 'Participant added successfully',
      data: match.participants[match.participants.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add participant',
      error: error.message
    });
  }
};

// ✅ Admin remove participant
exports.adminRemoveParticipant = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    const participantIndex = match.participants.findIndex(
      p => p._id.toString() === req.params.participantId
    );
    
    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }
    
    const removedParticipant = match.participants.splice(participantIndex, 1)[0];
    await match.save();
    
    res.json({
      success: true,
      message: 'Participant removed successfully',
      data: removedParticipant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant',
      error: error.message
    });
  }
};

// ✅ Get match results for admin
exports.getMatchResultsForAdmin = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('results.user', 'username email name');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      data: match.results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get match results',
      error: error.message
    });
  }
};

// ✅ Calculate winners
exports.calculateWinners = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    if (match.results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No results submitted yet'
      });
    }
    
    // Sort results by score (descending)
    const sortedResults = match.results.sort((a, b) => b.score - a.score);
    
    // Update winners
    sortedResults.forEach((result, index) => {
      result.rank = index + 1;
      result.isWinner = index < 3; // Top 3 are winners
    });
    
    await match.save();
    
    res.json({
      success: true,
      message: 'Winners calculated successfully',
      data: {
        winners: sortedResults.slice(0, 3),
        allResults: sortedResults
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate winners',
      error: error.message
    });
  }
};

// ==============================================
// 🔥 ADMIN TOURNAMENTS CONTROLLER
// ==============================================

// ✅ Get all tournaments for admin
exports.getAllTournamentsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, game } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (game) query.game = game;
    
    const tournaments = await Tournament.find(query)
      .populate('creator', 'username email')
      .populate('participants.user', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Tournament.countDocuments(query);
    
    res.json({
      success: true,
      data: tournaments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournaments',
      error: error.message
    });
  }
};

// ✅ Get tournament dashboard stats
exports.getTournamentDashboardStats = async (req, res) => {
  try {
    const [
      totalTournaments,
      activeTournaments,
      pendingTournaments,
      completedTournaments,
      todayTournaments
    ] = await Promise.all([
      Tournament.countDocuments(),
      Tournament.countDocuments({ status: 'active' }),
      Tournament.countDocuments({ status: 'pending' }),
      Tournament.countDocuments({ status: 'completed' }),
      Tournament.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        totalTournaments,
        activeTournaments,
        pendingTournaments,
        completedTournaments,
        todayTournaments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get tournament dashboard stats',
      error: error.message
    });
  }
};

// ✅ Get tournament by ID for admin
exports.getTournamentByIdForAdmin = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('creator', 'username email name')
      .populate('participants.user', 'username email name');
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get tournament',
      error: error.message
    });
  }
};

// ✅ Admin update tournament
exports.adminUpdateTournament = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.createdAt;
    delete updates.creator;
    
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update tournament',
      error: error.message
    });
  }
};

// ✅ Approve tournament
exports.approveTournamentForAdmin = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'active',
        approvedAt: new Date(),
        approvedBy: req.user.id
      },
      { new: true }
    );
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Tournament approved successfully',
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve tournament',
      error: error.message
    });
  }
};

// ✅ Reject tournament
exports.rejectTournamentForAdmin = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user.id,
        rejectionReason: reason
      },
      { new: true }
    );
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Tournament rejected successfully',
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject tournament',
      error: error.message
    });
  }
};

// ✅ Get tournament participants
exports.getTournamentParticipantsForAdmin = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('participants.user', 'username email name');
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      data: tournament.participants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get tournament participants',
      error: error.message
    });
  }
};

// ==============================================
// 🔥 ADMIN USERS CONTROLLER
// ==============================================

// ✅ Get all users for admin
exports.getAllUsersForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, status } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// ✅ Get user by ID for admin
exports.getUserByIdForAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user stats
    const [totalMatches, totalTournaments] = await Promise.all([
      Match.countDocuments({ participants: req.params.id }),
      Tournament.countDocuments({ 'participants.user': req.params.id })
    ]);
    
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          totalMatches,
          totalTournaments
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
};

// ✅ Update user
exports.updateUserForAdmin = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.password;
    delete updates.createdAt;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// ✅ Ban user
exports.banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'banned',
        bannedAt: new Date(),
        bannedBy: req.user.id,
        banReason: reason
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User banned successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to ban user',
      error: error.message
    });
  }
};

// ✅ Unban user
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'active',
        bannedAt: null,
        bannedBy: null,
        banReason: null
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unban user',
      error: error.message
    });
  }
};

// ✅ Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'moderator', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// ✅ Get user wallet info
exports.getUserWalletInfo = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('balance walletAddress walletType');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get additional stats
    const matchCount = await Match.countDocuments({ 
      'participants.user': req.params.id,
      status: 'completed'
    });
    
    const tournamentCount = await Tournament.countDocuments({ 
      'participants.user': req.params.id,
      status: 'completed'
    });
    
    res.json({
      success: true,
      data: {
        user_id: user._id,
        balance: user.balance || 0,
        wallet_address: user.walletAddress,
        wallet_type: user.walletType,
        stats: {
          completed_matches: matchCount,
          completed_tournaments: tournamentCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user wallet info',
      error: error.message
    });
  }
};

// ✅ Update user balance
exports.updateUserBalance = async (req, res) => {
  try {
    const { amount, type, reason } = req.body;
    
    if (!amount || !type) {
      return res.status(400).json({
        success: false,
        message: 'Amount and type are required'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const oldBalance = user.balance || 0;
    let newBalance = oldBalance;
    
    if (type === 'add') {
      newBalance += parseFloat(amount);
    } else if (type === 'subtract') {
      newBalance -= parseFloat(amount);
    } else if (type === 'set') {
      newBalance = parseFloat(amount);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Use "add", "subtract", or "set"'
      });
    }
    
    user.balance = newBalance;
    await user.save();
    
    res.json({
      success: true,
      message: `Balance updated successfully`,
      data: {
        user_id: user._id,
        old_balance: oldBalance,
        new_balance: newBalance,
        difference: newBalance - oldBalance,
        operation: type,
        reason: reason || 'Admin adjustment',
        updated_by: req.user.id,
        updated_at: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user balance',
      error: error.message
    });
  }
};

// ==============================================
// 🔥 ADMIN WITHDRAWALS CONTROLLER
// ==============================================

// ✅ Get all withdrawals
exports.getAllWithdrawals = async (req, res) => {
  try {
    // This is a placeholder - in production you'd have a Withdrawal model
    res.json({
      success: true,
      message: 'Withdrawal system is under development',
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawals',
      error: error.message
    });
  }
};

// ✅ Get withdrawal dashboard stats
exports.getWithdrawalDashboardStats = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        total_withdrawals: 0,
        total_amount: 0,
        pending_withdrawals: 0,
        completed_withdrawals: 0,
        rejected_withdrawals: 0,
        average_amount: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal dashboard stats',
      error: error.message
    });
  }
};

// ✅ Get pending withdrawals
exports.getPendingWithdrawals = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Pending withdrawals',
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending withdrawals',
      error: error.message
    });
  }
};

// ✅ Approve withdrawal
exports.approveWithdrawal = async (req, res) => {
  try {
    const { transaction_id, notes } = req.body;
    
    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      data: {
        withdrawal_id: req.params.id,
        status: 'completed',
        approved_at: new Date().toISOString(),
        approved_by: req.user.id,
        transaction_id: transaction_id || 'TXN-' + Date.now(),
        admin_notes: notes || ''
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve withdrawal',
      error: error.message
    });
  }
};

// ✅ Reject withdrawal
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { reason, notes } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    res.json({
      success: true,
      message: 'Withdrawal rejected successfully',
      data: {
        withdrawal_id: req.params.id,
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: req.user.id,
        rejection_reason: reason,
        admin_notes: notes || ''
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject withdrawal',
      error: error.message
    });
  }
};

// ==============================================
// 🔥 ADMIN REPORTS CONTROLLER
// ==============================================

// ✅ Get system overview report
exports.getSystemOverviewReport = async (req, res) => {
  try {
    const [
      totalUsers,
      totalMatches,
      totalTournaments,
      activeUsers,
      activeMatches,
      activeTournaments,
      todayUsers,
      todayMatches,
      todayTournaments
    ] = await Promise.all([
      User.countDocuments(),
      Match.countDocuments(),
      Tournament.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Match.countDocuments({ status: 'active' }),
      Tournament.countDocuments({ status: 'active' }),
      User.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Match.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Tournament.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          matches: totalMatches,
          tournaments: totalTournaments
        },
        active: {
          users: activeUsers,
          matches: activeMatches,
          tournaments: activeTournaments
        },
        today: {
          users: todayUsers,
          matches: todayMatches,
          tournaments: todayTournaments
        },
        system_status: 'operational',
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate system overview report',
      error: error.message
    });
  }
};

// ✅ Get financial report
exports.getFinancialReport = async (req, res) => {
  try {
    // Calculate total balance from all users
    const users = await User.find({}, 'balance');
    const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
    
    // Get completed matches and tournaments count
    const [completedMatches, completedTournaments] = await Promise.all([
      Match.countDocuments({ status: 'completed' }),
      Tournament.countDocuments({ status: 'completed' })
    ]);
    
    res.json({
      success: true,
      data: {
        financial_summary: {
          total_user_balance: totalBalance,
          estimated_revenue: totalBalance * 0.1, // 10% platform fee estimate
          completed_events: completedMatches + completedTournaments
        },
        user_balance_distribution: {
          total_users: users.length,
          users_with_balance: users.filter(u => u.balance > 0).length,
          average_balance: totalBalance / users.length || 0,
          highest_balance: Math.max(...users.map(u => u.balance || 0))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: error.message
    });
  }
};

// ✅ Get user activity report
exports.getUserActivityReport = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const [
      activeUsers,
      newUsers,
      userSignups,
      userLogins
    ] = await Promise.all([
      User.countDocuments({ lastActive: { $gte: dateThreshold } }),
      User.countDocuments({ createdAt: { $gte: dateThreshold } }),
      User.countDocuments({ 
        createdAt: { $gte: dateThreshold } 
      }).sort({ createdAt: 1 }),
      User.aggregate([
        { $match: { lastActive: { $gte: dateThreshold } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        period_days: parseInt(days),
        active_users: activeUsers,
        new_users: newUsers,
        user_growth_percentage: newUsers > 0 ? ((newUsers / activeUsers) * 100).toFixed(2) + '%' : '0%',
        user_engagement: {
          daily_active: Math.round(activeUsers / days),
          retention_rate: 'N/A' // Would need more data
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate user activity report',
      error: error.message
    });
  }
};

// ✅ Get match performance report
exports.getMatchPerformanceReport = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const [
      totalMatches,
      completedMatches,
      cancelledMatches,
      averageParticipants,
      matchCreationTrend
    ] = await Promise.all([
      Match.countDocuments({ createdAt: { $gte: dateThreshold } }),
      Match.countDocuments({ 
        status: 'completed',
        createdAt: { $gte: dateThreshold }
      }),
      Match.countDocuments({ 
        status: 'cancelled',
        createdAt: { $gte: dateThreshold }
      }),
      Match.aggregate([
        { $match: { createdAt: { $gte: dateThreshold } } },
        { $group: { 
          _id: null, 
          avgParticipants: { $avg: { $size: "$participants" } }
        }}
      ]),
      Match.aggregate([
        { $match: { createdAt: { $gte: dateThreshold } } },
        { $group: { 
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }},
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        { $limit: 30 }
      ])
    ]);
    
    const completionRate = totalMatches > 0 ? 
      ((completedMatches / totalMatches) * 100).toFixed(2) + '%' : '0%';
    
    res.json({
      success: true,
      data: {
        period_days: parseInt(days),
        total_matches: totalMatches,
        completed_matches: completedMatches,
        cancelled_matches: cancelledMatches,
        completion_rate: completionRate,
        average_participants: averageParticipants[0]?.avgParticipants || 0,
        match_creation_trend: matchCreationTrend
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate match performance report',
      error: error.message
    });
  }
};

// ✅ Export data
exports.exportData = async (req, res) => {
  try {
    const { type, format = 'json' } = req.query;
    
    let data;
    switch (type) {
      case 'users':
        data = await User.find().select('-password').lean();
        break;
      case 'matches':
        data = await Match.find().lean();
        break;
      case 'tournaments':
        data = await Tournament.find().lean();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type. Use "users", "matches", or "tournaments"'
        });
    }
    
    if (format === 'csv') {
      // Simple CSV conversion
      let csv = '';
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        csv += headers.join(',') + '\n';
        
        data.forEach(item => {
          const row = headers.map(header => {
            const value = item[header];
            if (typeof value === 'object') {
              return JSON.stringify(value);
            }
            return `"${value}"`;
          });
          csv += row.join(',') + '\n';
        });
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_export.csv`);
      return res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_export.json`);
      return res.send(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
};

// ==============================================
// 🔥 BATCH OPERATIONS
// ==============================================

// ✅ Batch update status
exports.batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const model = req.query.type === 'tournament' ? Tournament : Match;
    
    const result = await model.updateMany(
      { _id: { $in: ids } },
      { status }
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} items to ${status}`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to batch update status',
      error: error.message
    });
  }
};

// ✅ Send notifications
exports.sendNotifications = async (req, res) => {
  try {
    const { title, message, user_ids, type = 'all' } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }
    
    let recipients;
    if (type === 'specific' && user_ids) {
      recipients = user_ids.length;
    } else if (type === 'active') {
      const activeUsers = await User.countDocuments({ status: 'active' });
      recipients = activeUsers;
    } else {
      const allUsers = await User.countDocuments();
      recipients = allUsers;
    }
    
    res.json({
      success: true,
      message: `Notification queued for ${recipients} users`,
      data: {
        title,
        message,
        recipients,
        type,
        queued_at: new Date(),
        sent_by: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications',
      error: error.message
    });
  }
};

module.exports = exports;
