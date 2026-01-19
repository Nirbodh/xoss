// routes/invites.js - XOSS Gaming Invitation System
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');

// 🔹 MATCH INVITATIONS

// Invite friends to match
router.post('/match/:matchId/invite', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { friend_ids, message = '' } = req.body;
    const userId = req.user.userId;

    if (!friend_ids || !Array.isArray(friend_ids) || friend_ids.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'FRIENDS_REQUIRED',
        message: 'At least one friend is required'
      });
    }

    // Get match details
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found'
      });
    }

    // Check if match is joinable
    if (!match.is_joinable) {
      return res.status(400).json({
        success: false,
        code: 'MATCH_NOT_JOINABLE',
        message: 'This match is not currently joinable'
      });
    }

    // Check if user is already in the match
    const isParticipant = match.isUserJoined(userId);
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: 'You must be a participant to invite others'
      });
    }

    // Get friends details
    const friends = await User.find({
      _id: { $in: friend_ids },
      'social.friends': userId
    }).select('username avatar email settings.notifications');

    if (friends.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'NO_VALID_FRIENDS',
        message: 'No valid friends found to invite'
      });
    }

    // Create invitations
    const invitations = friends.map(friend => {
      const invitationId = `inv_${Date.now()}_${friend._id}_${matchId}`;
      
      return {
        invitation_id: invitationId,
        type: 'match',
        match_id: matchId,
        from_user_id: userId,
        from_username: req.user.username,
        from_avatar: req.user.avatar,
        to_user_id: friend._id,
        to_username: friend.username,
        to_avatar: friend.avatar,
        message: message,
        match_details: {
          title: match.title,
          game: match.game,
          prize_pool: match.total_prize,
          entry_fee: match.entry_fee,
          schedule_time: match.schedule_time,
          max_participants: match.max_participants,
          current_participants: match.current_participants,
          spots_left: match.max_participants - match.current_participants
        },
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        created_at: new Date(),
        metadata: {
          match_type: match.type,
          platform: match.platform
        }
      };
    });

    // In production, save to database
    // await Invitation.insertMany(invitations);

    // Send notifications to friends (simplified)
    // In production, use Notification model and push notifications
    console.log(`Sent ${invitations.length} match invitations`);

    res.json({
      success: true,
      code: 'INVITATIONS_SENT',
      message: `Invitations sent to ${invitations.length} friend(s)`,
      data: {
        match: {
          id: matchId,
          title: match.title,
          game: match.game
        },
        invitations: invitations.map(inv => ({
          invitation_id: inv.invitation_id,
          to_user: {
            id: inv.to_user_id,
            username: inv.to_username,
            avatar: inv.to_avatar
          },
          status: inv.status,
          expires_at: inv.expires_at
        })),
        summary: {
          total_invited: invitations.length,
          match_spots_left: match.max_participants - match.current_participants,
          invitation_expiry: '24 hours'
        }
      }
    });

  } catch (error) {
    console.error('❌ Send match invitations error:', error);
    res.status(500).json({
      success: false,
      code: 'INVITATION_ERROR',
      message: 'Failed to send invitations',
      error: error.message
    });
  }
});

// Accept match invitation
router.post('/match/:invitationId/accept', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.userId;

    // In production, get invitation from database
    // const invitation = await Invitation.findOne({
    //   invitation_id: invitationId,
    //   to_user_id: userId,
    //   status: 'pending',
    //   expires_at: { $gt: new Date() }
    // });

    // Mock invitation for demonstration
    const invitation = {
      invitation_id: invitationId,
      type: 'match',
      match_id: 'mock_match_id',
      from_user_id: 'mock_from_user',
      from_username: 'Test User',
      from_avatar: '',
      to_user_id: userId,
      status: 'pending',
      match_details: {
        title: 'Test Match',
        game: 'Free Fire',
        entry_fee: 100
      }
    };

    if (!invitation) {
      return res.status(404).json({
        success: false,
        code: 'INVITATION_NOT_FOUND',
        message: 'Invitation not found or expired'
      });
    }

    // Get match details
    const match = await Match.findById(invitation.match_id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found'
      });
    }

    // Check if match is still joinable
    if (!match.is_joinable) {
      return res.status(400).json({
        success: false,
        code: 'MATCH_NOT_JOINABLE',
        message: 'Match is no longer joinable'
      });
    }

    // Check if user already joined
    const alreadyJoined = match.isUserJoined(userId);
    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_JOINED',
        message: 'You have already joined this match'
      });
    }

    // Check if match is full
    if (match.current_participants >= match.max_participants) {
      return res.status(400).json({
        success: false,
        code: 'MATCH_FULL',
        message: 'Match is full'
      });
    }

    // Check wallet balance if entry fee > 0
    if (match.entry_fee > 0) {
      const { Wallet } = require('../models/Wallet');
      const wallet = await Wallet.findOrCreate(userId);
      
      if (wallet.available_balance < match.entry_fee) {
        return res.status(400).json({
          success: false,
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient balance to join match',
          required_amount: match.entry_fee,
          available_balance: wallet.available_balance
        });
      }
    }

    // Join the match (simplified - in production use match.join method)
    // await match.addParticipant(userId, {
    //   payment_status: match.entry_fee > 0 ? 'pending' : 'free',
    //   amount_paid: match.entry_fee,
    //   metadata: {
    //     join_method: 'invitation',
    //     invitation_id: invitationId
    //   }
    // });

    // Update invitation status
    // invitation.status = 'accepted';
    // invitation.accepted_at = new Date();
    // await invitation.save();

    // Notify inviter
    // await Notification.create({
    //   user_id: invitation.from_user_id,
    //   type: 'invitation_accepted',
    //   title: 'Invitation Accepted',
    //   message: `${req.user.username} accepted your match invitation`,
    //   data: { match_id: match._id, invitation_id: invitationId }
    // });

    res.json({
      success: true,
      code: 'INVITATION_ACCEPTED',
      message: 'Match invitation accepted successfully',
      data: {
        match: {
          id: match._id,
          title: match.title,
          game: match.game,
          schedule_time: match.schedule_time
        },
        invitation: {
          id: invitationId,
          status: 'accepted',
          accepted_at: new Date()
        },
        from_user: {
          id: invitation.from_user_id,
          username: invitation.from_username
        }
      }
    });

  } catch (error) {
    console.error('❌ Accept match invitation error:', error);
    res.status(500).json({
      success: false,
      code: 'ACCEPT_INVITATION_ERROR',
      message: 'Failed to accept invitation',
      error: error.message
    });
  }
});

// Decline match invitation
router.post('/match/:invitationId/decline', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { reason = '' } = req.body;
    const userId = req.user.userId;

    // Mock invitation for demonstration
    const invitation = {
      invitation_id: invitationId,
      type: 'match',
      from_user_id: 'mock_from_user',
      from_username: 'Test User',
      match_details: {
        title: 'Test Match',
        game: 'Free Fire'
      }
    };

    // Update invitation status
    // invitation.status = 'declined';
    // invitation.declined_at = new Date();
    // invitation.decline_reason = reason;
    // await invitation.save();

    // Notify inviter
    // await Notification.create({
    //   user_id: invitation.from_user_id,
    //   type: 'invitation_declined',
    //   title: 'Invitation Declined',
    //   message: `${req.user.username} declined your match invitation${reason ? `: ${reason}` : ''}`,
    //   data: { invitation_id: invitationId, reason }
    // });

    res.json({
      success: true,
      code: 'INVITATION_DECLINED',
      message: 'Match invitation declined',
      data: {
        invitation_id: invitationId,
        status: 'declined',
        declined_at: new Date(),
        reason: reason,
        match: invitation.match_details,
        from_user: {
          id: invitation.from_user_id,
          username: invitation.from_username
        }
      }
    });

  } catch (error) {
    console.error('❌ Decline match invitation error:', error);
    res.status(500).json({
      success: false,
      code: 'DECLINE_INVITATION_ERROR',
      message: 'Failed to decline invitation',
      error: error.message
    });
  }
});

// 🔹 TOURNAMENT INVITATIONS

// Invite friends to tournament
router.post('/tournament/:tournamentId/invite', auth, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { friend_ids, message = '' } = req.body;
    const userId = req.user.userId;

    if (!friend_ids || !Array.isArray(friend_ids) || friend_ids.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'FRIENDS_REQUIRED',
        message: 'At least one friend is required'
      });
    }

    // Get tournament details
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found'
      });
    }

    // Check if tournament is joinable
    if (!tournament.is_joinable) {
      return res.status(400).json({
        success: false,
        code: 'TOURNAMENT_NOT_JOINABLE',
        message: 'This tournament is not currently joinable'
      });
    }

    // Check if user is already in the tournament
    const isParticipant = tournament.isUserJoined(userId);
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: 'You must be a participant to invite others'
      });
    }

    // Get friends details
    const friends = await User.find({
      _id: { $in: friend_ids },
      'social.friends': userId
    }).select('username avatar email');

    if (friends.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'NO_VALID_FRIENDS',
        message: 'No valid friends found to invite'
      });
    }

    // Create invitations
    const invitations = friends.map(friend => {
      const invitationId = `inv_tour_${Date.now()}_${friend._id}_${tournamentId}`;
      
      return {
        invitation_id: invitationId,
        type: 'tournament',
        tournament_id: tournamentId,
        from_user_id: userId,
        from_username: req.user.username,
        from_avatar: req.user.avatar,
        to_user_id: friend._id,
        to_username: friend.username,
        to_avatar: friend.avatar,
        message: message,
        tournament_details: {
          title: tournament.title,
          game: tournament.game,
          prize_pool: tournament.total_prize,
          entry_fee: tournament.entry_fee,
          schedule_time: tournament.schedule_time,
          type: tournament.type,
          max_participants: tournament.max_participants,
          current_participants: tournament.current_participants,
          spots_left: tournament.max_participants - tournament.current_participants
        },
        status: 'pending',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        created_at: new Date(),
        metadata: {
          bracket_type: tournament.bracket_type,
          requires_verification: tournament.requires_verification
        }
      };
    });

    console.log(`Sent ${invitations.length} tournament invitations`);

    res.json({
      success: true,
      code: 'TOURNAMENT_INVITATIONS_SENT',
      message: `Tournament invitations sent to ${invitations.length} friend(s)`,
      data: {
        tournament: {
          id: tournamentId,
          title: tournament.title,
          game: tournament.game,
          type: tournament.type
        },
        invitations: invitations.map(inv => ({
          invitation_id: inv.invitation_id,
          to_user: {
            id: inv.to_user_id,
            username: inv.to_username,
            avatar: inv.to_avatar
          },
          status: inv.status,
          expires_at: inv.expires_at
        })),
        summary: {
          total_invited: invitations.length,
          tournament_spots_left: tournament.max_participants - tournament.current_participants,
          invitation_expiry: '48 hours'
        }
      }
    });

  } catch (error) {
    console.error('❌ Send tournament invitations error:', error);
    res.status(500).json({
      success: false,
      code: 'TOURNAMENT_INVITATION_ERROR',
      message: 'Failed to send tournament invitations',
      error: error.message
    });
  }
});

// 🔹 TEAM/SQUAD INVITATIONS

// Invite to team/squad
router.post('/team/invite', auth, async (req, res) => {
  try {
    const { friend_ids, match_id, tournament_id, message = '', team_name = '' } = req.body;
    const userId = req.user.userId;

    if (!friend_ids || !Array.isArray(friend_ids)) {
      return res.status(400).json({
        success: false,
        code: 'FRIENDS_REQUIRED',
        message: 'Friend IDs are required'
      });
    }

    // Validate event
    let event = null;
    let eventType = '';
    
    if (match_id) {
      event = await Match.findById(match_id);
      eventType = 'match';
    } else if (tournament_id) {
      event = await Tournament.findById(tournament_id);
      eventType = 'tournament';
    } else {
      return res.status(400).json({
        success: false,
        code: 'EVENT_REQUIRED',
        message: 'Match ID or Tournament ID is required'
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found'
      });
    }

    // Check if event supports teams/squads
    const validTeamTypes = ['Duo', 'Squad'];
    if (!validTeamTypes.includes(event.type)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EVENT_TYPE',
        message: 'Event does not support teams/squads'
      });
    }

    // Get friends details
    const friends = await User.find({
      _id: { $in: friend_ids },
      'social.friends': userId
    }).select('username avatar gaming.squad_preference');

    if (friends.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'NO_VALID_FRIENDS',
        message: 'No valid friends found to invite'
      });
    }

    // Check team size limits
    const teamSize = friends.length + 1; // Including inviter
    const maxTeamSize = event.type === 'Duo' ? 2 : 4;
    
    if (teamSize > maxTeamSize) {
      return res.status(400).json({
        success: false,
        code: 'TEAM_TOO_LARGE',
        message: `Maximum team size for ${event.type} is ${maxTeamSize}`,
        current_size: teamSize,
        max_size: maxTeamSize
      });
    }

    // Create team invitations
    const invitations = friends.map(friend => {
      const invitationId = `inv_team_${Date.now()}_${friend._id}_${event._id}`;
      
      return {
        invitation_id: invitationId,
        type: 'team',
        event_id: event._id,
        event_type: eventType,
        team_name: team_name || `${req.user.username}'s Team`,
        from_user_id: userId,
        from_username: req.user.username,
        from_avatar: req.user.avatar,
        to_user_id: friend._id,
        to_username: friend.username,
        to_avatar: friend.avatar,
        message: message,
        event_details: {
          title: event.title,
          game: event.game,
          type: event.type,
          schedule_time: event.schedule_time,
          prize_pool: event.total_prize,
          entry_fee: event.entry_fee
        },
        team_details: {
          proposed_team_size: teamSize,
          max_team_size: maxTeamSize,
          current_members: [{
            id: userId,
            username: req.user.username,
            role: 'leader'
          }]
        },
        status: 'pending',
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
        created_at: new Date()
      };
    });

    res.json({
      success: true,
      code: 'TEAM_INVITATIONS_SENT',
      message: `Team invitations sent to ${invitations.length} friend(s)`,
      data: {
        event: {
          id: event._id,
          title: event.title,
          game: event.game,
          type: event.type,
          schedule_time: event.schedule_time
        },
        team: {
          name: team_name || `${req.user.username}'s Team`,
          size: teamSize,
          max_size: maxTeamSize,
          leader: {
            id: userId,
            username: req.user.username
          }
        },
        invitations: invitations.map(inv => ({
          invitation_id: inv.invitation_id,
          to_user: {
            id: inv.to_user_id,
            username: inv.to_username,
            avatar: inv.to_avatar,
            squad_preference: inv.to_user?.gaming?.squad_preference || 'any'
          },
          status: inv.status,
          expires_at: inv.expires_at
        })),
        summary: {
          total_invited: invitations.length,
          invitation_expiry: '12 hours',
          required_acceptances: Math.ceil(teamSize / 2) // Simple majority
        }
      }
    });

  } catch (error) {
    console.error('❌ Send team invitations error:', error);
    res.status(500).json({
      success: false,
      code: 'TEAM_INVITATION_ERROR',
      message: 'Failed to send team invitations',
      error: error.message
    });
  }
});

// 🔹 INVITATION MANAGEMENT

// Get pending invitations
router.get('/pending', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Mock invitations for demonstration
    const mockInvitations = [
      {
        invitation_id: 'inv_match_1',
        type: 'match',
        from_user_id: 'user1',
        from_username: 'PlayerOne',
        from_avatar: '',
        match_details: {
          title: 'Free Fire Solo Match',
          game: 'Free Fire',
          prize_pool: 5000,
          entry_fee: 100,
          schedule_time: new Date(Date.now() + 2 * 60 * 60 * 1000)
        },
        status: 'pending',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
        expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000)
      },
      {
        invitation_id: 'inv_tournament_1',
        type: 'tournament',
        from_user_id: 'user2',
        from_username: 'TourneyMaster',
        from_avatar: '',
        tournament_details: {
          title: 'Weekly PUBG Tournament',
          game: 'PUBG Mobile',
          prize_pool: 25000,
          entry_fee: 500,
          schedule_time: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expires_at: new Date(Date.now() + 46 * 60 * 60 * 1000)
      }
    ];

    // Filter by type if specified
    let filteredInvitations = mockInvitations;
    if (type && type !== 'all') {
      filteredInvitations = mockInvitations.filter(inv => inv.type === type);
    }

    // Apply pagination
    const paginatedInvitations = filteredInvitations.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: {
        invitations: paginatedInvitations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredInvitations.length,
          pages: Math.ceil(filteredInvitations.length / limit),
          has_more: (page * limit) < filteredInvitations.length
        },
        summary: {
          total_pending: filteredInvitations.length,
          match_invitations: filteredInvitations.filter(inv => inv.type === 'match').length,
          tournament_invitations: filteredInvitations.filter(inv => inv.type === 'tournament').length,
          team_invitations: filteredInvitations.filter(inv => inv.type === 'team').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Get pending invitations error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_INVITATIONS_ERROR',
      message: 'Failed to fetch pending invitations',
      error: error.message
    });
  }
});

// Get sent invitations
router.get('/sent', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = 'pending', limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Mock sent invitations
    const mockSentInvitations = [
      {
        invitation_id: 'sent_inv_1',
        type: 'match',
        to_user_id: 'friend1',
        to_username: 'GamerFriend',
        to_avatar: '',
        match_details: {
          title: 'COD Mobile Match',
          game: 'COD Mobile',
          entry_fee: 50
        },
        status: 'pending',
        sent_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
        expires_at: new Date(Date.now() + 21 * 60 * 60 * 1000)
      },
      {
        invitation_id: 'sent_inv_2',
        type: 'team',
        to_user_id: 'friend2',
        to_username: 'SquadMate',
        to_avatar: '',
        event_details: {
          title: 'BGMI Squad Tournament',
          game: 'BGMI',
          type: 'Squad'
        },
        status: 'accepted',
        sent_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
        accepted_at: new Date(Date.now() - 5 * 60 * 60 * 1000)
      }
    ];

    // Filter by status
    let filteredInvitations = mockSentInvitations;
    if (status && status !== 'all') {
      filteredInvitations = mockSentInvitations.filter(inv => inv.status === status);
    }

    // Apply pagination
    const paginatedInvitations = filteredInvitations.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: {
        invitations: paginatedInvitations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredInvitations.length,
          pages: Math.ceil(filteredInvitations.length / limit),
          has_more: (page * limit) < filteredInvitations.length
        },
        statistics: {
          total_sent: filteredInvitations.length,
          pending: filteredInvitations.filter(inv => inv.status === 'pending').length,
          accepted: filteredInvitations.filter(inv => inv.status === 'accepted').length,
          declined: filteredInvitations.filter(inv => inv.status === 'declined').length,
          expired: filteredInvitations.filter(inv => inv.status === 'expired').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Get sent invitations error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_SENT_INVITATIONS_ERROR',
      message: 'Failed to fetch sent invitations',
      error: error.message
    });
  }
});

// Get invitation statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Mock statistics
    const statistics = {
      total_received: 15,
      total_sent: 23,
      acceptance_rate: 65.2,
      average_response_time: '2.5 hours',
      
      by_type: {
        match: {
          received: 8,
          sent: 12,
          accepted: 5,
          declined: 3
        },
        tournament: {
          received: 5,
          sent: 8,
          accepted: 3,
          declined: 2
        },
        team: {
          received: 2,
          sent: 3,
          accepted: 2,
          declined: 1
        }
      },
      
      by_status: {
        pending: 3,
        accepted: 10,
        declined: 5,
        expired: 2,
        cancelled: 3
      },
      
      recent_activity: {
        last_week: {
          received: 4,
          sent: 6,
          accepted: 3
        },
        last_month: {
          received: 12,
          sent: 18,
          accepted: 8
        }
      },
      
      most_active_friends: [
        { username: 'ProPlayer', invitations_sent: 5, invitations_received: 3 },
        { username: 'TourneyKing', invitations_sent: 3, invitations_received: 4 },
        { username: 'SquadLeader', invitations_sent: 4, invitations_received: 2 }
      ]
    };

    res.json({
      success: true,
      data: {
        statistics,
        user: {
          id: userId,
          username: req.user.username,
          friend_count: 24 // Mock value
        }
      }
    });

  } catch (error) {
    console.error('❌ Get invitation statistics error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_STATISTICS_ERROR',
      message: 'Failed to fetch invitation statistics',
      error: error.message
    });
  }
});

// Cancel invitation
router.delete('/:invitationId/cancel', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.userId;

    // Mock invitation
    const invitation = {
      invitation_id: invitationId,
      type: 'match',
      from_user_id: userId,
      to_user_id: 'friend1',
      to_username: 'GamerFriend',
      status: 'pending'
    };

    // Check if invitation exists and belongs to user
    if (!invitation || invitation.from_user_id !== userId) {
      return res.status(404).json({
        success: false,
        code: 'INVITATION_NOT_FOUND',
        message: 'Invitation not found or not authorized'
      });
    }

    // Check if already accepted/declined
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        code: 'INVITATION_NOT_PENDING',
        message: `Cannot cancel invitation with status: ${invitation.status}`
      });
    }

    // Update status
    // invitation.status = 'cancelled';
    // invitation.cancelled_at = new Date();
    // await invitation.save();

    // Notify recipient
    // await Notification.create({
    //   user_id: invitation.to_user_id,
    //   type: 'invitation_cancelled',
    //   title: 'Invitation Cancelled',
    //   message: `${req.user.username} cancelled their invitation`,
    //   data: { invitation_id: invitationId }
    // });

    res.json({
      success: true,
      code: 'INVITATION_CANCELLED',
      message: 'Invitation cancelled successfully',
      data: {
        invitation_id: invitationId,
        status: 'cancelled',
        cancelled_at: new Date(),
        to_user: {
          id: invitation.to_user_id,
          username: invitation.to_username
        }
      }
    });

  } catch (error) {
    console.error('❌ Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      code: 'CANCEL_INVITATION_ERROR',
      message: 'Failed to cancel invitation',
      error: error.message
    });
  }
});

// 🔹 BULK INVITATIONS

// Bulk invite to event
router.post('/bulk', auth, async (req, res) => {
  try {
    const { event_id, event_type, friend_ids, message = '' } = req.body;
    const userId = req.user.userId;

    if (!event_id || !event_type || !friend_ids || !Array.isArray(friend_ids)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REQUEST',
        message: 'Event ID, event type, and friend IDs are required'
      });
    }

    // Get event details
    let event;
    if (event_type === 'match') {
      event = await Match.findById(event_id);
    } else if (event_type === 'tournament') {
      event = await Tournament.findById(event_id);
    } else {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EVENT_TYPE',
        message: 'Invalid event type. Must be "match" or "tournament"'
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found'
      });
    }

    // Check if user is participant
    const isParticipant = event_type === 'match' ? 
      event.isUserJoined(userId) : 
      event.isUserJoined(userId);
    
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: 'You must be a participant to invite others'
      });
    }

    // Get friends
    const friends = await User.find({
      _id: { $in: friend_ids },
      'social.friends': userId
    }).select('username avatar');

    const successfulInvitations = [];
    const failedInvitations = [];

    friends.forEach(friend => {
      // Check event-specific limits
      const spotsLeft = event.max_participants - event.current_participants;
      if (spotsLeft <= 0) {
        failedInvitations.push({
          user_id: friend._id,
          username: friend.username,
          reason: 'Event is full'
        });
        return;
      }

      // Create invitation
      const invitationId = `inv_bulk_${Date.now()}_${friend._id}_${event_id}`;
      successfulInvitations.push({
        invitation_id: invitationId,
        to_user: {
          id: friend._id,
          username: friend.username,
          avatar: friend.avatar
        },
        status: 'pending'
      });
    });

    res.json({
      success: true,
      code: 'BULK_INVITATIONS_SENT',
      message: `Bulk invitations processed`,
      data: {
        event: {
          id: event_id,
          type: event_type,
          title: event.title,
          spots_left: event.max_participants - event.current_participants
        },
        results: {
          total_invited: friend_ids.length,
          successful: successfulInvitations.length,
          failed: failedInvitations.length,
          success_rate: friend_ids.length > 0 ? 
            (successfulInvitations.length / friend_ids.length) * 100 : 0
        },
        successful_invitations: successfulInvitations,
        failed_invitations: failedInvitations
      }
    });

  } catch (error) {
    console.error('❌ Bulk invitations error:', error);
    res.status(500).json({
      success: false,
      code: 'BULK_INVITATION_ERROR',
      message: 'Failed to send bulk invitations',
      error: error.message
    });
  }
});

// 🔹 ADMIN FUNCTIONS

// Get all invitations (admin)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { type, status, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Mock admin data
    const allInvitations = [
      {
        invitation_id: 'admin_inv_1',
        type: 'match',
        from_user: { username: 'PlayerOne', id: 'user1' },
        to_user: { username: 'PlayerTwo', id: 'user2' },
        event: { title: 'Free Fire Match', id: 'match1' },
        status: 'accepted',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        accepted_at: new Date(Date.now() - 23 * 60 * 60 * 1000)
      }
    ];

    // Apply filters
    let filtered = allInvitations;
    
    if (type && type !== 'all') {
      filtered = filtered.filter(inv => inv.type === type);
    }
    
    if (status && status !== 'all') {
      filtered = filtered.filter(inv => inv.status === status);
    }

    // Apply pagination
    const paginated = filtered.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: {
        invitations: paginated,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit)
        },
        statistics: {
          total: filtered.length,
          by_type: {
            match: filtered.filter(inv => inv.type === 'match').length,
            tournament: filtered.filter(inv => inv.type === 'tournament').length,
            team: filtered.filter(inv => inv.type === 'team').length
          },
          by_status: {
            pending: filtered.filter(inv => inv.status === 'pending').length,
            accepted: filtered.filter(inv => inv.status === 'accepted').length,
            declined: filtered.filter(inv => inv.status === 'declined').length
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Admin get invitations error:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_GET_INVITATIONS_ERROR',
      message: 'Failed to fetch invitations',
      error: error.message
    });
  }
});

// 🔹 HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Invitation System',
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: [
        'Match invitations',
        'Tournament invitations',
        'Team/Squad invitations',
        'Bulk invitations',
        'Invitation management',
        'Admin controls'
      ]
    }
  });
});

module.exports = router;
