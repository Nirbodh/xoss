// routes/chat.js - XOSS Gaming Chat System
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Since we haven't created the Chat model yet, let's create a simple in-memory structure
// In production, you'd use Socket.IO + MongoDB

// 🔹 IN-MEMORY STORAGE FOR DEMO (Replace with MongoDB in production)
const chatRooms = new Map();
const onlineUsers = new Map();

// Helper function to format chat message
const formatMessage = (sender, message, roomId, type = 'text') => {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sender_id: sender._id || sender.userId,
    sender_name: sender.name || sender.username,
    sender_avatar: sender.avatar,
    message: message,
    room_id: roomId,
    message_type: type,
    timestamp: new Date(),
    read_by: [sender._id || sender.userId],
    metadata: {}
  };
};

// 🔹 CHAT ROOM MANAGEMENT

// Get or create chat room
router.post('/room', auth, async (req, res) => {
  try {
    const { participant_ids, room_name, room_type = 'private' } = req.body;
    
    if (!participant_ids || !Array.isArray(participant_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Participant IDs are required'
      });
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([...participant_ids, req.user.userId])];
    
    if (allParticipants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 participants required for a chat room'
      });
    }

    // Generate room ID based on sorted participant IDs
    const sortedParticipants = allParticipants.sort();
    const roomId = `room_${sortedParticipants.join('_')}`;

    // Check if room already exists
    let room = chatRooms.get(roomId);
    
    if (!room) {
      // Create new room
      room = {
        id: roomId,
        name: room_name || `Chat with ${allParticipants.length} users`,
        type: room_type,
        participants: allParticipants,
        created_by: req.user.userId,
        created_at: new Date(),
        last_message: null,
        unread_count: {},
        is_active: true,
        metadata: {
          game_related: false,
          match_id: null,
          tournament_id: null
        }
      };

      // Initialize unread counts
      allParticipants.forEach(participantId => {
        room.unread_count[participantId] = 0;
      });

      chatRooms.set(roomId, room);
    }

    // Get participant details
    const User = require('../models/User');
    const participants = await User.find({
      _id: { $in: allParticipants }
    }).select('username avatar email last_active');

    res.json({
      success: true,
      data: {
        room: {
          ...room,
          participants: participants.map(user => ({
            id: user._id,
            username: user.username,
            avatar: user.avatar,
            email: user.email,
            is_online: onlineUsers.has(user._id.toString()),
            last_active: user.last_active
          }))
        }
      }
    });
  } catch (error) {
    console.error('❌ Create chat room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat room',
      error: error.message
    });
  }
});

// Get user's chat rooms
router.get('/rooms', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find rooms where user is a participant
    const userRooms = Array.from(chatRooms.values())
      .filter(room => 
        room.participants.includes(userId) && 
        room.is_active
      )
      .sort((a, b) => {
        // Sort by last message time
        const timeA = a.last_message?.timestamp || a.created_at;
        const timeB = b.last_message?.timestamp || b.created_at;
        return new Date(timeB) - new Date(timeA);
      });

    // Get participant details for each room
    const User = require('../models/User');
    const roomPromises = userRooms.map(async (room) => {
      const otherParticipants = room.participants.filter(id => id !== userId);
      const participants = await User.find({
        _id: { $in: otherParticipants }
      }).select('username avatar');

      return {
        ...room,
        participants: participants,
        unread_count: room.unread_count[userId] || 0,
        other_participants: participants.map(p => ({
          id: p._id,
          username: p.username,
          avatar: p.avatar,
          is_online: onlineUsers.has(p._id.toString())
        }))
      };
    });

    const roomsWithDetails = await Promise.all(roomPromises);

    res.json({
      success: true,
      data: {
        rooms: roomsWithDetails,
        total_rooms: roomsWithDetails.length,
        total_unread: roomsWithDetails.reduce((sum, room) => sum + (room.unread_count || 0), 0)
      }
    });
  } catch (error) {
    console.error('❌ Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat rooms',
      error: error.message
    });
  }
});

// Get specific chat room
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = chatRooms.get(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Check if user is a participant
    if (!room.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    // Get participant details
    const User = require('../models/User');
    const participants = await User.find({
      _id: { $in: room.participants }
    }).select('username avatar email last_active');

    // Get messages for this room (in production, query from DB)
    const messages = room.messages || [];
    const unreadCount = room.unread_count[userId] || 0;

    // Mark as read
    room.unread_count[userId] = 0;

    res.json({
      success: true,
      data: {
        room: {
          ...room,
          participants: participants.map(user => ({
            id: user._id,
            username: user.username,
            avatar: user.avatar,
            email: user.email,
            is_online: onlineUsers.has(user._id.toString()),
            last_active: user.last_active
          })),
          messages: messages.slice(-50), // Last 50 messages
          unread_count: unreadCount
        }
      }
    });
  } catch (error) {
    console.error('❌ Get chat room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat room',
      error: error.message
    });
  }
});

// 🔹 MESSAGE MANAGEMENT

// Send message
router.post('/message', auth, async (req, res) => {
  try {
    const { room_id, message, message_type = 'text', metadata = {} } = req.body;
    
    if (!room_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and message are required'
      });
    }

    const room = chatRooms.get(room_id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Check if user is a participant
    if (!room.participants.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    // Create message
    const chatMessage = formatMessage(
      req.user,
      message,
      room_id,
      message_type
    );

    // Add metadata
    chatMessage.metadata = {
      ...metadata,
      device: req.headers['user-agent'],
      ip: req.ip
    };

    // Initialize messages array if not exists
    if (!room.messages) {
      room.messages = [];
    }

    // Add message to room
    room.messages.push(chatMessage);
    room.last_message = chatMessage;

    // Update unread counts for other participants
    room.participants.forEach(participantId => {
      if (participantId !== req.user.userId) {
        room.unread_count[participantId] = (room.unread_count[participantId] || 0) + 1;
      }
    });

    // Update room
    chatRooms.set(room_id, room);

    // In production, save to database
    // const ChatMessage = require('../models/ChatMessage');
    // await ChatMessage.create(chatMessage);

    // Notify other participants via WebSocket/Socket.IO
    notifyRoomParticipants(room_id, chatMessage, req.user.userId);

    res.json({
      success: true,
      data: {
        message: chatMessage,
        room: {
          id: room_id,
          last_message: chatMessage,
          unread_count: room.unread_count
        }
      }
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Get messages for a room
router.get('/room/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before = null } = req.query;
    const userId = req.user.userId;

    const room = chatRooms.get(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Check if user is a participant
    if (!room.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    let messages = room.messages || [];

    // Filter messages before a certain timestamp
    if (before) {
      const beforeDate = new Date(before);
      messages = messages.filter(msg => new Date(msg.timestamp) < beforeDate);
    }

    // Sort by timestamp (newest first)
    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit results
    messages = messages.slice(0, parseInt(limit));

    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      !msg.read_by.includes(userId)
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        if (!msg.read_by.includes(userId)) {
          msg.read_by.push(userId);
        }
      });

      // Update unread count
      room.unread_count[userId] = Math.max(0, (room.unread_count[userId] || 0) - unreadMessages.length);
      chatRooms.set(roomId, room);
    }

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          limit: parseInt(limit),
          before: before,
          has_more: messages.length === parseInt(limit),
          total_messages: room.messages?.length || 0
        },
        unread_marked: unreadMessages.length
      }
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// Mark messages as read
router.post('/messages/read', auth, async (req, res) => {
  try {
    const { room_id, message_ids = [] } = req.body;
    const userId = req.user.userId;

    if (!room_id) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const room = chatRooms.get(room_id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Check if user is a participant
    if (!room.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    let markedCount = 0;

    if (message_ids.length > 0) {
      // Mark specific messages as read
      room.messages?.forEach(msg => {
        if (message_ids.includes(msg.id) && !msg.read_by.includes(userId)) {
          msg.read_by.push(userId);
          markedCount++;
        }
      });
    } else {
      // Mark all messages in room as read
      room.messages?.forEach(msg => {
        if (!msg.read_by.includes(userId)) {
          msg.read_by.push(userId);
          markedCount++;
        }
      });

      // Reset unread count
      room.unread_count[userId] = 0;
    }

    // Update room
    chatRooms.set(room_id, room);

    res.json({
      success: true,
      data: {
        room_id,
        marked_count: markedCount,
        unread_count: room.unread_count[userId] || 0
      }
    });
  } catch (error) {
    console.error('❌ Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
});

// Delete message
router.delete('/message/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { room_id } = req.body;
    const userId = req.user.userId;

    if (!room_id) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const room = chatRooms.get(room_id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Check if user is a participant
    if (!room.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    // Find message
    const messageIndex = room.messages?.findIndex(msg => msg.id === messageId);
    
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const message = room.messages[messageIndex];

    // Check if user is sender or admin
    if (message.sender_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Mark as deleted instead of removing
    room.messages[messageIndex].deleted = true;
    room.messages[messageIndex].deleted_at = new Date();
    room.messages[messageIndex].deleted_by = userId;
    room.messages[messageIndex].message = 'This message was deleted';

    // Update room
    chatRooms.set(room_id, room);

    res.json({
      success: true,
      data: {
        message_id: messageId,
        deleted: true,
        deleted_at: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
});

// 🔹 USER STATUS & PRESENCE

// Update user online status
router.post('/presence/online', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { socket_id, device_info = {} } = req.body;

    onlineUsers.set(userId, {
      user_id: userId,
      username: req.user.username,
      socket_id: socket_id,
      device_info: device_info,
      last_seen: new Date(),
      is_online: true
    });

    // Notify user's contacts about online status
    notifyContactsOnlineStatus(userId, true);

    res.json({
      success: true,
      data: {
        user_id: userId,
        status: 'online',
        last_seen: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Update online status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update online status',
      error: error.message
    });
  }
});

// Update user offline status
router.post('/presence/offline', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Update user's last seen
    const userStatus = onlineUsers.get(userId);
    if (userStatus) {
      userStatus.is_online = false;
      userStatus.last_seen = new Date();
      onlineUsers.set(userId, userStatus);
    } else {
      onlineUsers.set(userId, {
        user_id: userId,
        username: req.user.username,
        is_online: false,
        last_seen: new Date()
      });
    }

    // Update user's last active in database
    const User = require('../models/User');
    await User.findByIdAndUpdate(userId, {
      $set: { 'metadata.last_active': new Date() }
    });

    // Notify user's contacts about offline status
    notifyContactsOnlineStatus(userId, false);

    res.json({
      success: true,
      data: {
        user_id: userId,
        status: 'offline',
        last_seen: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Update offline status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update offline status',
      error: error.message
    });
  }
});

// Get online contacts
router.get('/contacts/online', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's friends/contacts
    const User = require('../models/User');
    const user = await User.findById(userId).select('social.friends');
    
    const friendIds = user?.social?.friends || [];
    
    // Get online friends
    const onlineContacts = [];
    
    onlineUsers.forEach((status, id) => {
      if (friendIds.includes(id) && status.is_online) {
        onlineContacts.push({
          user_id: id,
          username: status.username,
          last_seen: status.last_seen,
          device_info: status.device_info
        });
      }
    });

    res.json({
      success: true,
      data: {
        online_contacts: onlineContacts,
        total_online: onlineContacts.length,
        total_friends: friendIds.length
      }
    });
  } catch (error) {
    console.error('❌ Get online contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online contacts',
      error: error.message
    });
  }
});

// 🔹 GROUP CHAT MANAGEMENT

// Create group chat
router.post('/group', auth, async (req, res) => {
  try {
    const { name, participant_ids, avatar, description, is_public = false } = req.body;
    
    if (!name || !participant_ids || !Array.isArray(participant_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Group name and participants are required'
      });
    }

    // Add creator to participants
    const allParticipants = [...new Set([...participant_ids, req.user.userId])];
    
    if (allParticipants.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Group chat requires at least 3 participants'
      });
    }

    // Generate unique group ID
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create group
    const group = {
      id: groupId,
      name: name,
      type: 'group',
      avatar: avatar,
      description: description,
      participants: allParticipants,
      admins: [req.user.userId],
      created_by: req.user.userId,
      created_at: new Date(),
      is_public: is_public,
      is_active: true,
      settings: {
        allow_new_members: true,
        allow_message_delete: true,
        allow_admin_promotion: true,
        announcement_only: false
      },
      metadata: {
        member_count: allParticipants.length,
        last_activity: new Date()
      },
      messages: [],
      unread_count: {}
    };

    // Initialize unread counts
    allParticipants.forEach(participantId => {
      group.unread_count[participantId] = 0;
    });

    // Store group
    chatRooms.set(groupId, group);

    // Get participant details
    const User = require('../models/User');
    const participants = await User.find({
      _id: { $in: allParticipants }
    }).select('username avatar');

    res.json({
      success: true,
      data: {
        group: {
          ...group,
          participants: participants.map(user => ({
            id: user._id,
            username: user.username,
            avatar: user.avatar,
            is_online: onlineUsers.has(user._id.toString()),
            is_admin: group.admins.includes(user._id.toString())
          }))
        }
      }
    });
  } catch (error) {
    console.error('❌ Create group chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group chat',
      error: error.message
    });
  }
});

// Update group settings
router.put('/group/:groupId/settings', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { settings } = req.body;
    const userId = req.user.userId;

    const group = chatRooms.get(groupId);
    
    if (!group || group.type !== 'group') {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    if (!group.admins.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can update settings'
      });
    }

    // Update settings
    group.settings = {
      ...group.settings,
      ...settings
    };

    // Update group
    chatRooms.set(groupId, group);

    res.json({
      success: true,
      data: {
        group_id: groupId,
        settings: group.settings,
        updated_by: userId,
        updated_at: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Update group settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group settings',
      error: error.message
    });
  }
});

// Add members to group
router.post('/group/:groupId/members', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { user_ids } = req.body;
    const userId = req.user.userId;

    if (!user_ids || !Array.isArray(user_ids)) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    const group = chatRooms.get(groupId);
    
    if (!group || group.type !== 'group') {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin or if group allows new members
    if (!group.admins.includes(userId) && !group.settings.allow_new_members) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add members'
      });
    }

    // Add new members
    const newMembers = user_ids.filter(id => !group.participants.includes(id));
    group.participants.push(...newMembers);

    // Initialize unread counts for new members
    newMembers.forEach(memberId => {
      group.unread_count[memberId] = 0;
    });

    // Update metadata
    group.metadata.member_count = group.participants.length;
    group.metadata.last_activity = new Date();

    // Update group
    chatRooms.set(groupId, group);

    // Get new member details
    const User = require('../models/User');
    const newMembersDetails = await User.find({
      _id: { $in: newMembers }
    }).select('username avatar');

    // Send welcome message
    const welcomeMessage = formatMessage(
      req.user,
      `${newMembersDetails.map(m => m.username).join(', ')} joined the group`,
      groupId,
      'system'
    );
    
    group.messages.push(welcomeMessage);
    group.last_message = welcomeMessage;

    res.json({
      success: true,
      data: {
        group_id: groupId,
        added_members: newMembersDetails,
        total_members: group.participants.length,
        added_by: userId,
        added_at: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Add group members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add group members',
      error: error.message
    });
  }
});

// Remove member from group
router.delete('/group/:groupId/members/:memberId', auth, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.userId;

    const group = chatRooms.get(groupId);
    
    if (!group || group.type !== 'group') {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin or removing themselves
    const isAdmin = group.admins.includes(userId);
    const isSelfRemoval = userId === memberId;

    if (!isAdmin && !isSelfRemoval) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove other members'
      });
    }

    // Check if trying to remove the last admin
    if (group.admins.includes(memberId) && group.admins.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last admin'
      });
    }

    // Remove member
    group.participants = group.participants.filter(id => id !== memberId);
    
    // Remove from admins if they were admin
    group.admins = group.admins.filter(id => id !== memberId);
    
    // Remove unread count
    delete group.unread_count[memberId];

    // Update metadata
    group.metadata.member_count = group.participants.length;
    group.metadata.last_activity = new Date();

    // Update group
    chatRooms.set(groupId, group);

    // Get member details
    const User = require('../models/User');
    const member = await User.findById(memberId).select('username');

    // Send leave message
    const leaveMessage = formatMessage(
      req.user,
      `${member?.username || 'User'} left the group`,
      groupId,
      'system'
    );
    
    group.messages.push(leaveMessage);
    group.last_message = leaveMessage;

    res.json({
      success: true,
      data: {
        group_id: groupId,
        removed_member: memberId,
        removed_by: userId,
        removed_at: new Date(),
        remaining_members: group.participants.length
      }
    });
  } catch (error) {
    console.error('❌ Remove group member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove group member',
      error: error.message
    });
  }
});

// 🔹 ADMIN FUNCTIONS

// Get all chat rooms (admin only)
router.get('/admin/rooms', adminAuth, async (req, res) => {
  try {
    const { type, active_only = true } = req.query;

    let rooms = Array.from(chatRooms.values());

    // Apply filters
    if (type) {
      rooms = rooms.filter(room => room.type === type);
    }

    if (active_only) {
      rooms = rooms.filter(room => room.is_active);
    }

    // Get participant counts
    rooms = rooms.map(room => ({
      ...room,
      participant_count: room.participants.length,
      message_count: room.messages?.length || 0,
      last_activity: room.last_message?.timestamp || room.created_at
    }));

    // Sort by last activity
    rooms.sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));

    res.json({
      success: true,
      data: {
        rooms: rooms,
        statistics: {
          total_rooms: rooms.length,
          private_rooms: rooms.filter(r => r.type === 'private').length,
          group_rooms: rooms.filter(r => r.type === 'group').length,
          active_rooms: rooms.filter(r => r.is_active).length,
          total_messages: rooms.reduce((sum, room) => sum + (room.messages?.length || 0), 0),
          total_participants: new Set(rooms.flatMap(r => r.participants)).size
        }
      }
    });
  } catch (error) {
    console.error('❌ Admin get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat rooms',
      error: error.message
    });
  }
});

// Delete chat room (admin only)
router.delete('/admin/room/:roomId', adminAuth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = chatRooms.get(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Archive instead of delete
    room.is_active = false;
    room.archived_at = new Date();
    room.archived_by = req.user.userId;
    chatRooms.set(roomId, room);

    res.json({
      success: true,
      data: {
        room_id: roomId,
        archived: true,
        archived_at: new Date(),
        archived_by: req.user.userId,
        message_count: room.messages?.length || 0,
        participant_count: room.participants.length
      }
    });
  } catch (error) {
    console.error('❌ Admin delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat room',
      error: error.message
    });
  }
});

// Get chat statistics (admin only)
router.get('/admin/statistics', adminAuth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const rooms = Array.from(chatRooms.values());
    const activeRooms = rooms.filter(room => room.is_active);

    // Calculate daily message counts
    const dailyStats = {};
    
    activeRooms.forEach(room => {
      room.messages?.forEach(msg => {
        const date = msg.timestamp.toISOString().split('T')[0];
        if (new Date(msg.timestamp) >= startDate) {
          if (!dailyStats[date]) {
            dailyStats[date] = {
              date,
              message_count: 0,
              user_count: new Set(),
              room_count: new Set()
            };
          }
          dailyStats[date].message_count++;
          dailyStats[date].user_count.add(msg.sender_id);
          dailyStats[date].room_count.add(room.id);
        }
      });
    });

    const formattedStats = Object.values(dailyStats)
      .map(stat => ({
        date: stat.date,
        message_count: stat.message_count,
        user_count: stat.user_count.size,
        room_count: stat.room_count.size,
        avg_messages_per_user: stat.user_count.size > 0 ? 
          stat.message_count / stat.user_count.size : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate overall statistics
    const totalMessages = activeRooms.reduce((sum, room) => sum + (room.messages?.length || 0), 0);
    const uniqueUsers = new Set(activeRooms.flatMap(r => r.participants)).size;
    const avgMessagesPerDay = formattedStats.length > 0 ? 
      totalMessages / formattedStats.length : 0;

    res.json({
      success: true,
      data: {
        period: {
          days: parseInt(days),
          start_date: startDate.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        },
        daily_statistics: formattedStats,
        overall_statistics: {
          total_rooms: activeRooms.length,
          total_messages: totalMessages,
          unique_users: uniqueUsers,
          avg_messages_per_day: avgMessagesPerDay.toFixed(2),
          avg_messages_per_room: activeRooms.length > 0 ? 
            totalMessages / activeRooms.length : 0,
          avg_messages_per_user: uniqueUsers > 0 ? 
            totalMessages / uniqueUsers : 0,
          online_users: onlineUsers.size,
          active_chats_last_hour: activeRooms.filter(room => {
            const lastMessage = room.last_message?.timestamp;
            return lastMessage && new Date(lastMessage) > new Date(Date.now() - 60 * 60 * 1000);
          }).length
        },
        room_type_distribution: {
          private: activeRooms.filter(r => r.type === 'private').length,
          group: activeRooms.filter(r => r.type === 'group').length
        }
      }
    });
  } catch (error) {
    console.error('❌ Admin chat statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat statistics',
      error: error.message
    });
  }
});

// 🔹 HELPER FUNCTIONS

// Notify room participants about new message
function notifyRoomParticipants(roomId, message, senderId) {
  const room = chatRooms.get(roomId);
  if (!room) return;

  room.participants.forEach(participantId => {
    if (participantId !== senderId) {
      const userStatus = onlineUsers.get(participantId);
      if (userStatus && userStatus.is_online) {
        // In production, send via Socket.IO
        // io.to(userStatus.socket_id).emit('new_message', {
        //   room_id: roomId,
        //   message: message
        // });
        console.log(`Notify ${participantId} about new message in ${roomId}`);
      }
    }
  });
}

// Notify contacts about online status change
function notifyContactsOnlineStatus(userId, isOnline) {
  // In production, notify user's contacts via Socket.IO
  console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
}

// 🔹 HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Chat System',
      status: 'operational',
      timestamp: new Date().toISOString(),
      statistics: {
        total_rooms: chatRooms.size,
        online_users: onlineUsers.size,
        active_ch
