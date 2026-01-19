// routes/friends.js - XOSS Gaming Friends System
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');

// 🔹 FRIEND REQUESTS

// Send friend request
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    // Check if trying to add self
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        code: 'SELF_FRIEND_REQUEST',
        message: 'Cannot send friend request to yourself'
      });
    }

    // Get both users
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Check if already friends
    const isAlreadyFriend = currentUser.social?.friends?.includes(userId);
    if (isAlreadyFriend) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_FRIENDS',
        message: 'You are already friends with this user'
      });
    }

    // Check if request already sent
    const requestAlreadySent = targetUser.social?.friend_requests?.includes(currentUserId);
    if (requestAlreadySent) {
      return res.status(400).json({
        success: false,
        code: 'REQUEST_ALREADY_SENT',
        message: 'Friend request already sent'
      });
    }

    // Check if request already received
    const requestAlreadyReceived = currentUser.social?.friend_requests?.includes(userId);
    if (requestAlreadyReceived) {
      return res.status(400).json({
        success: false,
        code: 'REQUEST_ALREADY_RECEIVED',
        message: 'This user has already sent you a friend request'
      });
    }

    // Add friend request to target user
    if (!targetUser.social.friend_requests) {
      targetUser.social.friend_requests = [];
    }
    
    if (!targetUser.social.friend_requests.includes(currentUserId)) {
      targetUser.social.friend_requests.push(currentUserId);
      await targetUser.save();
    }

    // Create notification for target user (in production, use Notification model)
    // await Notification.create({
    //   user_id: userId,
    //   type: 'friend_request',
    //   title: 'New Friend Request',
    //   message: `${currentUser.username} sent you a friend request`,
    //   data: { from_user_id: currentUserId }
    // });

    res.json({
      success: true,
      code: 'FRIEND_REQUEST_SENT',
      message: 'Friend request sent successfully',
      data: {
        from_user: {
          id: currentUserId,
          username: currentUser.username,
          avatar: currentUser.avatar
        },
        to_user: {
          id: userId,
          username: targetUser.username,
          avatar: targetUser.avatar
        },
        sent_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Send friend request error:', error);
    res.status(500).json({
      success: false,
      code: 'FRIEND_REQUEST_ERROR',
      message: 'Failed to send friend request',
      error: error.message
    });
  }
});

// Accept friend request
router.post('/accept/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    // Get both users
    const [currentUser, requestingUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Check if request exists
    const requestExists = currentUser.social?.friend_requests?.includes(userId);
    if (!requestExists) {
      return res.status(400).json({
        success: false,
        code: 'NO_FRIEND_REQUEST',
        message: 'No friend request from this user'
      });
    }

    // Remove from friend requests
    currentUser.social.friend_requests = currentUser.social.friend_requests.filter(
      id => id.toString() !== userId
    );

    // Add to friends for both users
    if (!currentUser.social.friends) {
      currentUser.social.friends = [];
    }
    if (!requestingUser.social.friends) {
      requestingUser.social.friends = [];
    }

    if (!currentUser.social.friends.includes(userId)) {
      currentUser.social.friends.push(userId);
    }
    if (!requestingUser.social.friends.includes(currentUserId)) {
      requestingUser.social.friends.push(currentUserId);
    }

    // Remove from any pending requests in reverse
    if (requestingUser.social?.friend_requests?.includes(currentUserId)) {
      requestingUser.social.friend_requests = requestingUser.social.friend_requests.filter(
        id => id.toString() !== currentUserId
      );
    }

    // Save both users
    await Promise.all([
      currentUser.save(),
      requestingUser.save()
    ]);

    // Create notifications for both users
    // await Notification.create([
    //   {
    //     user_id: currentUserId,
    //     type: 'friend_request_accepted',
    //     title: 'Friend Request Accepted',
    //     message: `You are now friends with ${requestingUser.username}`,
    //     data: { friend_id: userId }
    //   },
    //   {
    //     user_id: userId,
    //     type: 'friend_request_accepted',
    //     title: 'Friend Request Accepted',
    //     message: `${currentUser.username} accepted your friend request`,
    //     data: { friend_id: currentUserId }
    //   }
    // ]);

    res.json({
      success: true,
      code: 'FRIEND_REQUEST_ACCEPTED',
      message: 'Friend request accepted successfully',
      data: {
        users: [
          {
            id: currentUserId,
            username: currentUser.username,
            avatar: currentUser.avatar
          },
          {
            id: userId,
            username: requestingUser.username,
            avatar: requestingUser.avatar
          }
        ],
        became_friends_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Accept friend request error:', error);
    res.status(500).json({
      success: false,
      code: 'FRIEND_ACCEPT_ERROR',
      message: 'Failed to accept friend request',
      error: error.message
    });
  }
});

// Reject friend request
router.post('/reject/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const { reason = '' } = req.body;

    const currentUser = await User.findById(currentUserId);

    // Check if request exists
    const requestExists = currentUser.social?.friend_requests?.includes(userId);
    if (!requestExists) {
      return res.status(400).json({
        success: false,
        code: 'NO_FRIEND_REQUEST',
        message: 'No friend request from this user'
      });
    }

    // Remove from friend requests
    currentUser.social.friend_requests = currentUser.social.friend_requests.filter(
      id => id.toString() !== userId
    );

    await currentUser.save();

    // Create notification for requesting user
    // await Notification.create({
    //   user_id: userId,
    //   type: 'friend_request_rejected',
    //   title: 'Friend Request Rejected',
    //   message: `${currentUser.username} rejected your friend request${reason ? `: ${reason}` : ''}`,
    //   data: { from_user_id: currentUserId, reason }
    // });

    res.json({
      success: true,
      code: 'FRIEND_REQUEST_REJECTED',
      message: 'Friend request rejected successfully',
      data: {
        from_user: {
          id: currentUserId,
          username: currentUser.username
        },
        rejected_user: {
          id: userId
        },
        reason: reason,
        rejected_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Reject friend request error:', error);
    res.status(500).json({
      success: false,
      code: 'FRIEND_REJECT_ERROR',
      message: 'Failed to reject friend request',
      error: error.message
    });
  }
});

// Cancel friend request
router.post('/cancel/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Check if request was sent
    const requestSent = targetUser.social?.friend_requests?.includes(currentUserId);
    if (!requestSent) {
      return res.status(400).json({
        success: false,
        code: 'NO_REQUEST_SENT',
        message: 'No friend request sent to this user'
      });
    }

    // Remove from target user's friend requests
    targetUser.social.friend_requests = targetUser.social.friend_requests.filter(
      id => id.toString() !== currentUserId
    );

    await targetUser.save();

    res.json({
      success: true,
      code: 'FRIEND_REQUEST_CANCELLED',
      message: 'Friend request cancelled successfully',
      data: {
        cancelled_by: {
          id: currentUserId,
          username: req.user.username
        },
        target_user: {
          id: userId,
          username: targetUser.username
        },
        cancelled_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Cancel friend request error:', error);
    res.status(500).json({
      success: false,
      code: 'FRIEND_CANCEL_ERROR',
      message: 'Failed to cancel friend request',
      error: error.message
    });
  }
});

// 🔹 FRIEND MANAGEMENT

// Get all friends
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 50, 
      search = '',
      online_only = false,
      sort_by = 'username' 
    } = req.query;

    const skip = (page - 1) * limit;

    const user = await User.findById(userId).select('social.friends');
    const friendIds = user?.social?.friends || [];

    if (friendIds.length === 0) {
      return res.json({
        success: true,
        data: {
          friends: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 1
          },
          statistics: {
            total_friends: 0,
            online_friends: 0,
            offline_friends: 0
          }
        }
      });
    }

    // Build query
    let query = { _id: { $in: friendIds } };
    
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') }
      ];
    }

    if (online_only) {
      // In production, check online status from Redis/Socket.IO
      // This is a simplified version
      query['metadata.last_active'] = { 
        $gte: new Date(Date.now() - 5 * 60 * 1000) // Active in last 5 minutes
      };
    }

    // Get sort options
    let sort = {};
    switch (sort_by) {
      case 'username':
        sort.username = 1;
        break;
      case 'recent_activity':
        sort['metadata.last_active'] = -1;
        break;
      case 'win_rate':
        sort['stats.win_rate'] = -1;
        break;
      default:
        sort.username = 1;
    }

    // Get friends with details
    const [friends, total] = await Promise.all([
      User.find(query)
        .select('username avatar email stats.level stats.win_rate stats.rank_score metadata.last_active gaming.favorite_game')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    // Add online status and friendship duration
    const friendsWithStatus = friends.map(friend => {
      const isOnline = friend.metadata?.last_active && 
        new Date(friend.metadata.last_active) > new Date(Date.now() - 5 * 60 * 1000);
      
      return {
        id: friend._id,
        username: friend.username,
        avatar: friend.avatar,
        email: friend.email,
        is_online: isOnline,
        last_active: friend.metadata?.last_active,
        formatted_last_active: friend.metadata?.last_active ? 
          formatTimeAgo(friend.metadata.last_active) : 'Never',
        stats: {
          level: friend.stats?.level?.current || 1,
          win_rate: friend.stats?.win_rate || 0,
          rank_score: friend.stats?.rank_score || 1000
        },
        favorite_game: friend.gaming?.favorite_game || 'Free Fire',
        friendship_since: null // Would need separate friendship model for this
      };
    });

    // Get online friends count
    const onlineFriends = friendsWithStatus.filter(f => f.is_online).length;

    res.json({
      success: true,
      data: {
        friends: friendsWithStatus,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1
        },
        statistics: {
          total_friends: friendIds.length,
          online_friends: onlineFriends,
          offline_friends: friendIds.length - onlineFriends,
          online_percentage: friendIds.length > 0 ? 
            (onlineFriends / friendIds.length) * 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Get friends error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_FRIENDS_ERROR',
      message: 'Failed to fetch friends',
      error: error.message
    });
  }
});

// Get friend by ID
router.get('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    // Check if they are friends
    const user = await User.findById(userId).select('social.friends');
    const isFriend = user?.social?.friends?.includes(friendId);

    if (!isFriend) {
      return res.status(403).json({
        success: false,
        code: 'NOT_FRIENDS',
        message: 'You are not friends with this user'
      });
    }

    // Get friend details
    const friend = await User.findById(friendId)
      .select('username avatar email phone name stats gaming social.social_links metadata.last_active created_at');

    if (!friend) {
      return res.status(404).json({
        success: false,
        code: 'FRIEND_NOT_FOUND',
        message: 'Friend not found'
      });
    }

    // Get mutual friends
    const mutualFriends = await getMutualFriends(userId, friendId);

    // Get recent matches together (simplified)
    const Match = require('../models/Match');
    const recentMatches = await Match.find({
      'participants.user': { $all: [userId, friendId] },
      status: 'completed'
    })
      .select('title game completed_at winners')
      .sort({ completed_at: -1 })
      .limit(5);

    // Check online status
    const isOnline = friend.metadata?.last_active && 
      new Date(friend.metadata.last_active) > new Date(Date.now() - 5 * 60 * 1000);

    res.json({
      success: true,
      data: {
        friend: {
          id: friend._id,
          username: friend.username,
          avatar: friend.avatar,
          email: friend.email,
          phone: friend.phone,
          name: friend.name,
          is_online: isOnline,
          last_active: friend.metadata?.last_active,
          formatted_last_active: friend.metadata?.last_active ? 
            formatTimeAgo(friend.metadata.last_active) : 'Never',
          member_since: friend.created_at,
          stats: friend.stats || {},
          gaming: friend.gaming || {},
          social_links: friend.social?.social_links || {}
        },
        friendship_info: {
          mutual_friends: mutualFriends.length,
          mutual_friends_list: mutualFriends.slice(0, 10),
          recent_matches_together: recentMatches.length,
          recent_matches: recentMatches.map(match => ({
            id: match._id,
            title: match.title,
            game: match.game,
            completed_at: match.completed_at
          }))
        }
      }
    });

  } catch (error) {
    console.error('❌ Get friend error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_FRIEND_ERROR',
      message: 'Failed to fetch friend details',
      error: error.message
    });
  }
});

// Remove friend
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    // Get both users
    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId)
    ]);

    if (!friend) {
      return res.status(404).json({
        success: false,
        code: 'FRIEND_NOT_FOUND',
        message: 'Friend not found'
      });
    }

    // Check if they are friends
    const isFriend = user?.social?.friends?.includes(friendId);
    if (!isFriend) {
      return res.status(400).json({
        success: false,
        code: 'NOT_FRIENDS',
        message: 'You are not friends with this user'
      });
    }

    // Remove from both users' friend lists
    user.social.friends = user.social.friends.filter(
      id => id.toString() !== friendId
    );
    
    friend.social.friends = friend.social.friends.filter(
      id => id.toString() !== userId
    );

    // Also remove from friend requests if present
    if (user.social.friend_requests?.includes(friendId)) {
      user.social.friend_requests = user.social.friend_requests.filter(
        id => id.toString() !== friendId
      );
    }
    
    if (friend.social.friend_requests?.includes(userId)) {
      friend.social.friend_requests = friend.social.friend_requests.filter(
        id => id.toString() !== userId
      );
    }

    // Save both users
    await Promise.all([
      user.save(),
      friend.save()
    ]);

    res.json({
      success: true,
      code: 'FRIEND_REMOVED',
      message: 'Friend removed successfully',
      data: {
        removed_friend: {
          id: friendId,
          username: friend.username
        },
        removed_by: {
          id: userId,
          username: user.username
        },
        removed_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Remove friend error:', error);
    res.status(500).json({
      success: false,
      code: 'REMOVE_FRIEND_ERROR',
      message: 'Failed to remove friend',
      error: error.message
    });
  }
});

// 🔹 FRIEND REQUESTS MANAGEMENT

// Get pending friend requests
router.get('/requests/pending', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .select('social.friend_requests')
      .populate({
        path: 'social.friend_requests',
        select: 'username avatar email stats.level gaming.favorite_game created_at',
        options: {
          skip: skip,
          limit: Number(limit),
          sort: { created_at: -1 }
        }
      });

    const friendRequests = user?.social?.friend_requests || [];
    const total = user?.social?.friend_requests?.length || 0;

    // Format requests
    const formattedRequests = friendRequests.map(request => ({
      id: request._id,
      username: request.username,
      avatar: request.avatar,
      email: request.email,
      level: request.stats?.level?.current || 1,
      favorite_game: request.gaming?.favorite_game || 'Free Fire',
      member_since: request.created_at,
      request_received_at: new Date() // Would need timestamps in real implementation
    }));

    res.json({
      success: true,
      data: {
        pending_requests: formattedRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
          has_more: page * limit < total
        }
      }
    });

  } catch (error) {
    console.error('❌ Get pending requests error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_REQUESTS_ERROR',
      message: 'Failed to fetch pending friend requests',
      error: error.message
    });
  }
});

// Get sent friend requests
router.get('/requests/sent', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Find users who have current user in their friend_requests
    const [sentRequests, total] = await Promise.all([
      User.find({
        'social.friend_requests': userId
      })
        .select('username avatar email stats.level created_at')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments({
        'social.friend_requests': userId
      })
    ]);

    const formattedRequests = sentRequests.map(user => ({
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
      level: user.stats?.level?.current || 1,
      member_since: user.created_at,
      request_sent_at: new Date() // Would need timestamps in real implementation
    }));

    res.json({
      success: true,
      data: {
        sent_requests: formattedRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
          has_more: page * limit < total
        }
      }
    });

  } catch (error) {
    console.error('❌ Get sent requests error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_SENT_REQUESTS_ERROR',
      message: 'Failed to fetch sent friend requests',
      error: error.message
    });
  }
});

// 🔹 FRIEND SUGGESTIONS

// Get friend suggestions
router.get('/suggestions', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    const user = await User.findById(userId)
      .select('social.friends social.friend_requests gaming.favorite_game stats.level');

    const friendIds = user?.social?.friends || [];
    const pendingRequestIds = user?.social?.friend_requests || [];
    
    // Users to exclude (friends, pending requests, and self)
    const excludeIds = [...friendIds, ...pendingRequestIds, userId];

    // Get suggestions based on:
    // 1. Same favorite game
    // 2. Similar level/rank
    // 3. Mutual friends
    // 4. Recent activity

    const favoriteGame = user.gaming?.favorite_game || 'Free Fire';
    const userLevel = user.stats?.level?.current || 1;

    // Find users with same favorite game
    const gameSuggestions = await User.find({
      _id: { $nin: excludeIds },
      'gaming.favorite_game': favoriteGame
    })
      .select('username avatar stats.level stats.win_rate gaming.favorite_game metadata.last_active')
      .limit(Number(limit))
      .lean();

    // Find users with similar level (±2 levels)
    const levelSuggestions = await User.find({
      _id: { $nin: excludeIds },
      'stats.level.current': { 
        $gte: Math.max(1, userLevel - 2),
        $lte: userLevel + 2
      }
    })
      .select('username avatar stats.level stats.win_rate gaming.favorite_game metadata.last_active')
      .limit(Number(limit))
      .lean();

    // Find users with mutual friends
    const mutualFriendSuggestions = await getMutualFriendSuggestions(userId, excludeIds, Number(limit));

    // Combine and deduplicate suggestions
    const allSuggestions = [
      ...gameSuggestions,
      ...levelSuggestions,
      ...mutualFriendSuggestions
    ];

    // Remove duplicates by user ID
    const uniqueSuggestions = [];
    const seenIds = new Set();

    allSuggestions.forEach(suggestion => {
      if (!seenIds.has(suggestion._id.toString()) && uniqueSuggestions.length < limit) {
        seenIds.add(suggestion._id.toString());
        
        // Calculate suggestion score
        const score = calculateSuggestionScore(suggestion, user);
        
        uniqueSuggestions.push({
          id: suggestion._id,
          username: suggestion.username,
          avatar: suggestion.avatar,
          level: suggestion.stats?.level?.current || 1,
          win_rate: suggestion.stats?.win_rate || 0,
          favorite_game: suggestion.gaming?.favorite_game || 'Free Fire',
          last_active: suggestion.metadata?.last_active,
          is_online: suggestion.metadata?.last_active && 
            new Date(suggestion.metadata.last_active) > new Date(Date.now() - 5 * 60 * 1000),
          suggestion_reasons: getSuggestionReasons(suggestion, user),
          suggestion_score: score
        });
      }
    });

    // Sort by suggestion score
    uniqueSuggestions.sort((a, b) => b.suggestion_score - a.suggestion_score);

    res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions.slice(0, limit),
        total_suggestions: uniqueSuggestions.length,
        suggestion_criteria: {
          favorite_game: favoriteGame,
          user_level: userLevel,
          total_friends: friendIds.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Get friend suggestions error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_SUGGESTIONS_ERROR',
      message: 'Failed to fetch friend suggestions',
      error: error.message
    });
  }
});

// 🔹 FRIEND ACTIVITIES

// Get friends' recent activities
router.get('/activities/recent', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;

    const user = await User.findById(userId).select('social.friends');
    const friendIds = user?.social?.friends || [];

    if (friendIds.length === 0) {
      return res.json({
        success: true,
        data: {
          activities: [],
          total_activities: 0
        }
      });
    }

    // Get recent matches from friends
    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');

    const [recentMatches, recentTournaments] = await Promise.all([
      Match.find({
        'participants.user': { $in: friendIds },
        status: 'completed'
      })
        .select('title game completed_at winners participants')
        .populate('participants.user', 'username avatar')
        .sort({ completed_at: -1 })
        .limit(Number(limit)),
      Tournament.find({
        'participants.user': { $in: friendIds },
        status: 'completed'
      })
        .select('title game completed_at winners participants')
        .populate('participants.user', 'username avatar')
        .sort({ completed_at: -1 })
        .limit(Number(limit))
    ]);

    // Combine and format activities
    const activities = [];

    recentMatches.forEach(match => {
      const friendParticipants = match.participants.filter(p => 
        friendIds.includes(p.user?._id?.toString())
      );

      friendParticipants.forEach(participant => {
        activities.push({
          type: 'match',
          event_id: match._id,
          event_title: match.title,
          game: match.game,
          friend_id: participant.user._id,
          friend_username: participant.user.username,
          friend_avatar: participant.user.avatar,
          activity: 'played_match',
          result: match.winners.some(w => w.user?.toString() === participant.user._id.toString()) ? 'won' : 'played',
          timestamp: match.completed_at,
          formatted_timestamp: formatTimeAgo(match.completed_at)
        });
      });
    });

    recentTournaments.forEach(tournament => {
      const friendParticipants = tournament.participants.filter(p => 
        friendIds.includes(p.user?._id?.toString())
      );

      friendParticipants.forEach(participant => {
        const isWinner = tournament.winners.some(w => 
          w.user?.toString() === participant.user._id.toString()
        );

        activities.push({
          type: 'tournament',
          event_id: tournament._id,
          event_title: tournament.title,
          game: tournament.game,
          friend_id: participant.user._id,
          friend_username: participant.user.username,
          friend_avatar: participant.user.avatar,
          activity: isWinner ? 'won_tournament' : 'joined_tournament',
          result: isWinner ? 'won' : 'participated',
          timestamp: tournament.completed_at,
          formatted_timestamp: formatTimeAgo(tournament.completed_at)
        });
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: {
        activities: activities.slice(0, limit),
        total_activities: activities.length,
        summary: {
          matches_played: recentMatches.length,
          tournaments_joined: recentTournaments.length,
          unique_friends_active: new Set(activities.map(a => a.friend_id)).size
        }
      }
    });

  } catch (error) {
    console.error('❌ Get friends activities error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_ACTIVITIES_ERROR',
      message: 'Failed to fetch friends activities',
      error: error.message
    });
  }
});

// Get friends who are online
router.get('/online', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50 } = req.query;

    const user = await User.findById(userId).select('social.friends');
    const friendIds = user?.social?.friends || [];

    if (friendIds.length === 0) {
      return res.json({
        success: true,
        data: {
          online_friends: [],
          total_online: 0
        }
      });
    }

    // Get friends who were active in last 5 minutes
    const onlineFriends = await User.find({
      _id: { $in: friendIds },
      'metadata.last_active': { 
        $gte: new Date(Date.now() - 5 * 60 * 1000)
      }
    })
      .select('username avatar stats.level gaming.favorite_game metadata.last_active')
      .limit(Number(limit))
      .lean();

    const formattedFriends = onlineFriends.map(friend => ({
      id: friend._id,
      username: friend.username,
      avatar: friend.avatar,
      level: friend.stats?.level?.current || 1,
      favorite_game: friend.gaming?.favorite_game || 'Free Fire',
      last_active: friend.metadata?.last_active,
      is_online: true,
      formatted_last_active: formatTimeAgo(friend.metadata?.last_active)
    }));

    // Sort by most recently active
    formattedFriends.sort((a, b) => new Date(b.last_active) - new Date(a.last_active));

    res.json({
      success: true,
      data: {
        online_friends: formattedFriends,
        total_online: formattedFriends.length,
        total_friends: friendIds.length,
        online_percentage: friendIds.length > 0 ? 
          (formattedFriends.length / friendIds.length) * 100 : 0
      }
    });

  } catch (error) {
    console.error('❌ Get online friends error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_ONLINE_FRIENDS_ERROR',
      message: 'Failed to fetch online friends',
      error: error.message
    });
  }
});

// 🔹 FRIEND STATISTICS

// Get friends statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('social.friends');
    const friendIds = user?.social?.friends || [];

    if (friendIds.length === 0) {
      return res.json({
        success: true,
        data: {
          total_friends: 0,
          statistics: {},
          leaderboards: []
        }
      });
    }

    // Get friends with stats
    const friends = await User.find({
      _id: { $in: friendIds }
    })
      .select('username avatar stats level gaming.favorite_game metadata.last_active')
      .lean();

    // Calculate statistics
    const statistics = {
      total_friends: friends.length,
      online_friends: friends.filter(f => 
        f.metadata?.last_active && 
        new Date(f.metadata.last_active) > new Date(Date.now() - 5 * 60 * 1000)
      ).length,
      average_level: friends.length > 0 ? 
        friends.reduce((sum, f) => sum + (f.stats?.level?.current || 1), 0) / friends.length : 0,
      average_win_rate: friends.length > 0 ? 
        friends.reduce((sum, f) => sum + (f.stats?.win_rate || 0), 0) / friends.length : 0,
      game_distribution: {},
      level_distribution: {}
    };

    // Calculate game distribution
    friends.forEach(friend => {
      const game = friend.gaming?.favorite_game || 'Unknown';
      statistics.game_distribution[game] = (statistics.game_distribution[game] || 0) + 1;
    });

    // Calculate level distribution
    friends.forEach(friend => {
      const level = friend.stats?.level?.current || 1;
      const levelRange = Math.floor(level / 10) * 10; // Group by 10s
      statistics.level_distribution[levelRange] = (statistics.level_distribution[levelRange] || 0) + 1;
    });

    // Create leaderboards
    const leaderboards = {
      by_win_rate: [...friends]
        .sort((a, b) => (b.stats?.win_rate || 0) - (a.stats?.win_rate || 0))
        .slice(0, 10)
        .map(f => ({
          id: f._id,
          username: f.username,
          avatar: f.avatar,
          win_rate: f.stats?.win_rate || 0
        })),
      
      by_level: [...friends]
        .sort((a, b) => (b.stats?.level?.current || 1) - (a.stats?.level?.current || 1))
        .slice(0, 10)
        .map(f => ({
          id: f._id,
          username: f.username,
          avatar: f.avatar,
          level: f.stats?.level?.current || 1
        })),
      
      by_activity: [...friends]
        .sort((a, b) => new Date(b.metadata?.last_active || 0) - new Date(a.metadata?.last_active || 0))
        .slice(0, 10)
        .map(f => ({
          id: f._id,
          username: f.username,
          avatar: f.avatar,
          last_active: f.metadata?.last_active,
          is_online: f.metadata?.last_active && 
            new Date(f.metadata.last_active) > new Date(Date.now() - 5 * 60 * 1000)
        }))
    };

    res.json({
      success: true,
      data: {
        statistics,
        leaderboards,
        friends_summary: {
          most_common_game: Object.entries(statistics.game_distribution)
            .sort((a, b) => b[1] - a[1])[0] || ['Unknown', 0],
          highest_level_friend: leaderboards.by_level[0],
          highest_win_rate_friend: leaderboards.by_win_rate[0]
        }
      }
    });

  } catch (error) {
    console.error('❌ Get friends statistics error:', error);
    res.status(500).json({
      success: false,
      code: 'GET_STATISTICS_ERROR',
      message: 'Failed to fetch friends statistics',
      error: error.message
    });
  }
});

// 🔹 HELPER FUNCTIONS

// Get mutual friends between two users
async function getMutualFriends(userId1, userId2) {
  const [user1, user2] = await Promise.all([
    User.findById(userId1).select('social.friends'),
    User.findById(userId2).select('social.friends')
  ]);

  const friends1 = user1?.social?.friends || [];
  const friends2 = user2?.social?.friends || [];

  // Find intersection
  const mutualFriendIds = friends1.filter(id => 
    friends2.some(friendId => friendId.toString() === id.toString())
  );

  // Get mutual friends details
  if (mutualFriendIds.length > 0) {
    const mutualFriends = await User.find({
      _id: { $in: mutualFriendIds }
    })
      .select('username avatar')
      .lean();
    
    return mutualFriends;
  }

  return [];
}

// Get friend suggestions based on mutual friends
async function getMutualFriendSuggestions(userId, excludeIds, limit) {
  const user = await User.findById(userId).select('social.friends');
  const friendIds = user?.social?.friends || [];

  if (friendIds.length === 0) return [];

  // Get friends of friends
  const friendsOfFriends = await User.aggregate([
    {
      $match: {
        _id: { $in: friendIds }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'social.friends',
        foreignField: '_id',
        as: 'friends_of_friend'
      }
    },
    {
      $unwind: '$friends_of_friend'
    },
    {
      $match: {
        'friends_of_friend._id': { 
          $nin: [...excludeIds, userId] 
        }
      }
    },
    {
      $group: {
        _id: '$friends_of_friend._id',
        username: { $first: '$friends_of_friend.username' },
        avatar: { $first: '$friends_of_friend.avatar' },
        mutual_friend_count: { $sum: 1 },
        mutual_friends: { 
          $push: {
            id: '$_id',
            username: '$username'
          }
        }
      }
    },
    {
      $sort: { mutual_friend_count: -1 }
    },
    {
      $limit: limit
    }
  ]);

  return friendsOfFriends;
}

// Calculate suggestion score
function calculateSuggestionScore(suggestion, user) {
  let score = 0;

  // Same favorite game: +30 points
  if (suggestion.gaming?.favorite_game === user.gaming?.favorite_game) {
    score += 30;
  }

  // Similar level: ±2 levels = +20 points, ±5 levels = +10 points
  const suggestionLevel = suggestion.stats?.level?.current || 1;
  const userLevel = user.stats?.level?.current || 1;
  const levelDiff = Math.abs(suggestionLevel - userLevel);
  
  if (levelDiff <= 2) {
    score += 20;
  } else if (levelDiff <= 5) {
    score += 10;
  }

  // Online recently: +15 points
  if (suggestion.metadata?.last_active && 
      new Date(suggestion.metadata.last_active) > new Date(Date.now() - 15 * 60 * 1000)) {
    score += 15;
  }

  // High win rate: +5 to +10 points
  const winRate = suggestion.stats?.win_rate || 0;
  if (winRate > 50) score += 5;
  if (winRate > 70) score += 5;

  return score;
}

// Get suggestion reasons
function getSuggestionReasons(suggestion, user) {
  const reasons = [];

  if (suggestion.gaming?.favorite_game === user.gaming?.favorite_game) {
    reasons.push(`Plays ${suggestion.gaming.favorite_game}`);
  }

  const suggestionLevel = suggestion.stats?.level?.current || 1;
  const userLevel = user.stats?.level?.current || 1;
  const levelDiff = Math.abs(suggestionLevel - userLevel);
  
  if (levelDiff <= 2) {
    reasons.push('Similar level');
  }

  if (suggestion.metadata?.last_active && 
      new Date(suggestion.metadata.last_active) > new Date(Date.now() - 15 * 60 * 1000)) {
    reasons.push('Recently active');
  }

  const winRate = suggestion.stats?.win_rate || 0;
  if (winRate > 60) {
    reasons.push('High win rate');
  }

  return reasons;
}

// Format time ago
function formatTimeAgo(date) {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(date).toLocaleDateString('en-BD');
}

// 🔹 HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Friends System',
      status: 'operational',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /api/friends/request/:userId - Send friend request',
        'POST /api/friends/accept/:userId - Accept friend request',
        'POST /api/friends/reject/:userId - Reject friend request',
        'POST /api/friends/cancel/:userId - Cancel sent request',
        'GET /api/friends - Get all friends',
        'GET /api/friends/:friendId - Get friend details',
        'DELETE /api/friends/:friendId - Remove friend',
        'GET /api/friends/requests/pending - Get pending requests',
        'GET /api/friends/requests/sent - Get sent requests',
        'GET /api/friends/suggestions - Get friend suggestions',
        'GET /api/friends/activities/recent - Get friends activities',
        'GET /api/friends/online - Get online friends',
        'GET /api/friends/statistics - Get friends statistics'
      ]
    }
  });
});

module.exports = router;
