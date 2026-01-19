// controllers/supportController.js - SUPPORT SYSTEM CONTROLLER
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');
const { formatCurrency } = require('../utils/helpers');

// 🔥 CONSTANTS
const SUPPORT_CATEGORIES = [
  { id: 'technical', name: 'Technical Issues', icon: '🔧' },
  { id: 'billing', name: 'Billing & Payments', icon: '💰' },
  { id: 'account', name: 'Account Issues', icon: '👤' },
  { id: 'tournament', name: 'Tournament Support', icon: '🏆' },
  { id: 'match', name: 'Match Support', icon: '🎮' },
  { id: 'withdrawal', name: 'Withdrawal Issues', icon: '💸' },
  { id: 'suggestion', name: 'Suggestions', icon: '💡' },
  { id: 'other', name: 'Other', icon: '❓' }
];

const PRIORITY_LEVELS = {
  low: { response_time: '48 hours', color: 'green' },
  medium: { response_time: '24 hours', color: 'blue' },
  high: { response_time: '12 hours', color: 'orange' },
  urgent: { response_time: '6 hours', color: 'red' }
};

// ==================== GET FAQs ====================
exports.getFAQs = async (req, res) => {
  try {
    const faqs = [
      {
        id: 1,
        question: 'How do I join a tournament?',
        answer: 'Go to Tournaments page, select a tournament, and click "Join Now". Ensure you have sufficient wallet balance if there\'s an entry fee.',
        category: 'tournament'
      },
      {
        id: 2,
        question: 'How long does withdrawal take?',
        answer: 'Withdrawals are processed within 24-48 hours. BKash/Nagad usually within 24 hours, Bank transfers may take 48-72 hours.',
        category: 'withdrawal'
      },
      {
        id: 3,
        question: 'How to verify my account?',
        answer: 'Go to Settings → Verification section. Upload required documents (NID/Passport). Verification takes 1-2 business days.',
        category: 'account'
      },
      {
        id: 4,
        question: 'How are prizes distributed?',
        answer: 'Prizes are distributed within 24 hours after tournament results are verified. Winners receive payment to their wallet.',
        category: 'tournament'
      },
      {
        id: 5,
        question: 'What is the minimum withdrawal amount?',
        answer: 'Minimum withdrawal is ৳100. Maximum daily withdrawal limit is ৳50,000.',
        category: 'withdrawal'
      }
    ];

    res.json({
      success: true,
      code: 'FAQS_FETCHED',
      message: 'FAQs fetched successfully',
      data: {
        faqs,
        categories: SUPPORT_CATEGORIES,
        contact_info: {
          email: 'support@xossgaming.com',
          phone: '+880XXXXXXXXXX',
          whatsapp: '+880XXXXXXXXXX',
          address: 'Dhaka, Bangladesh'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ GET FAQs ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FAQ_ERROR',
      message: 'Failed to fetch FAQs',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET CATEGORIES ====================
exports.getCategories = async (req, res) => {
  try {
    res.json({
      success: true,
      code: 'CATEGORIES_FETCHED',
      message: 'Support categories fetched',
      data: {
        categories: SUPPORT_CATEGORIES,
        priority_levels: PRIORITY_LEVELS
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ GET CATEGORIES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'CATEGORIES_ERROR',
      message: 'Failed to fetch categories',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== CREATE TICKET ====================
exports.createTicket = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.userId;
    const { subject, category, priority, message, order_id, screenshot_url } = req.body;

    console.log('🎫 CREATE TICKET:', { userId: req.user.username, subject, category });

    // Generate ticket number
    const ticketNumber = `TKT${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create ticket
    const ticketData = {
      ticket_number: ticketNumber,
      user_id: userId,
      subject,
      category,
      priority,
      status: 'open',
      messages: [{
        sender_type: 'user',
        message,
        attachments: screenshot_url ? [{ type: 'image', url: screenshot_url }] : []
      }],
      metadata: {
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        order_id: order_id || null
      }
    };

    const [ticket] = await Ticket.create([ticketData], { session });

    // Send email notification to support team
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'support@xossgaming.com',
      subject: `New Support Ticket: ${ticketNumber} - ${subject}`,
      template: 'new_ticket',
      data: {
        ticket_number: ticketNumber,
        subject,
        category,
        priority,
        user: req.user.username,
        message,
        created_at: new Date().toISOString(),
        dashboard_url: `${process.env.ADMIN_URL}/support/tickets/${ticket._id}`
      }
    });

    // Create notification for user
    await Notification.create([{
      user_id: userId,
      type: 'ticket_created',
      title: 'Support Ticket Created',
      message: `Your support ticket #${ticketNumber} has been created. We'll respond within ${PRIORITY_LEVELS[priority].response_time}.`,
      data: {
        ticket_id: ticket._id,
        ticket_number: ticketNumber,
        subject,
        priority,
        estimated_response: PRIORITY_LEVELS[priority].response_time
      },
      priority: 'medium'
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ TICKET CREATED: ${ticketNumber} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      code: 'TICKET_CREATED',
      message: 'Support ticket created successfully',
      data: {
        ticket: formatTicketResponse(ticket),
        response_info: {
          estimated_response: PRIORITY_LEVELS[priority].response_time,
          ticket_number: ticketNumber,
          priority: priority.toUpperCase()
        },
        next_steps: [
          'Check your email for ticket confirmation',
          'Monitor notifications for updates',
          'You can add more messages to this ticket'
        ]
      },
      timestamp: new Date().toISOString(),
      reference_id: ticketNumber
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ CREATE TICKET ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'TICKET_CREATION_FAILED',
      message: 'Failed to create support ticket',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET MY TICKETS ====================
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, category, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = { user_id: userId };
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get tickets
    const tickets = await Ticket.find(filter)
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Ticket.countDocuments(filter);

    // Get stats
    const stats = await Ticket.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObj = {
      open: 0,
      pending: 0,
      resolved: 0,
      closed: 0,
      total: total
    };

    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
    });

    console.log(`✅ FOUND ${tickets.length} tickets for user ${userId}`);

    res.json({
      success: true,
      code: 'TICKETS_FETCHED',
      message: `Found ${tickets.length} tickets`,
      data: {
        tickets: tickets.map(t => formatTicketResponse(t)),
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        },
        statistics: statsObj,
        filters: {
          status: status || 'all',
          category: category || 'all'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ GET MY TICKETS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'TICKETS_FETCH_ERROR',
      message: 'Failed to fetch tickets',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET TICKET BY ID ====================
exports.getTicketById = async (req, res) => {
  try {
    const ticket = req.ticket;
    const userId = req.user.userId;

    // Check authorization
    if (ticket.user_id.toString() !== userId.toString() && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'You are not authorized to view this ticket',
        timestamp: new Date().toISOString()
      });
    }

    // Populate user info
    await ticket.populate('user_id', 'username email avatar');
    if (ticket.assigned_to) {
      await ticket.populate('assigned_to', 'username');
    }

    // Mark as read if user is viewing
    if (ticket.user_id._id.toString() === userId.toString()) {
      ticket.last_viewed_by_user = new Date();
      await ticket.save();
    }

    res.json({
      success: true,
      code: 'TICKET_FETCHED',
      message: 'Ticket details fetched',
      data: {
        ticket: formatTicketResponse(ticket),
        support_info: {
          response_time: PRIORITY_LEVELS[ticket.priority].response_time,
          can_reply: ticket.status !== 'closed' && ticket.status !== 'resolved',
          is_assigned: !!ticket.assigned_to
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ GET TICKET ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'TICKET_FETCH_ERROR',
      message: 'Failed to fetch ticket details',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== UPDATE TICKET ====================
exports.updateTicket = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ticket = req.ticket;
    const userId = req.user.userId;
    const { subject, priority, category } = req.body;

    // Check authorization
    if (ticket.user_id.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'You can only update your own tickets',
        timestamp: new Date().toISOString()
      });
    }

    // Check if ticket can be updated
    if (['closed', 'resolved'].includes(ticket.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TICKET_CLOSED',
        message: 'Cannot update closed/resolved tickets',
        timestamp: new Date().toISOString()
      });
    }

    // Update ticket
    if (subject) ticket.subject = subject;
    if (priority) ticket.priority = priority;
    if (category) ticket.category = category;
    
    ticket.updated_at = new Date();
    
    // Add to history
    if (!ticket.update_history) {
      ticket.update_history = [];
    }
    
    ticket.update_history.push({
      updated_by: userId,
      updated_at: new Date(),
      changes: Object.keys(req.body).filter(key => req.body[key] !== undefined),
      reason: 'User updated ticket'
    });

    await ticket.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ TICKET UPDATED: ${ticket.ticket_number} by ${req.user.username}`);

    res.json({
      success: true,
      code: 'TICKET_UPDATED',
      message: 'Ticket updated successfully',
      data: {
        ticket: formatTicketResponse(ticket),
        updated_fields: Object.keys(req.body).filter(key => req.body[key] !== undefined)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ UPDATE TICKET ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'TICKET_UPDATE_FAILED',
      message: 'Failed to update ticket',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADD MESSAGE ====================
exports.addMessage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ticket = req.ticket;
    const userId = req.user.userId;
    const { message, attachments = [] } = req.body;

    // Check authorization
    const isUser = ticket.user_id.toString() === userId.toString();
    const isAdmin = ['admin', 'moderator'].includes(req.user.role);
    
    if (!isUser && !isAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'You are not authorized to add messages to this ticket',
        timestamp: new Date().toISOString()
      });
    }

    // Check if ticket is open
    if (['closed', 'resolved'].includes(ticket.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TICKET_CLOSED',
        message: 'Cannot add messages to closed/resolved tickets',
        timestamp: new Date().toISOString()
      });
    }

    // Add message
    const newMessage = {
      sender_type: isAdmin ? 'support' : 'user',
      sender_id: userId,
      message,
      attachments,
      timestamp: new Date()
    };

    ticket.messages.push(newMessage);
    ticket.updated_at = new Date();
    
    // Update status
    if (isAdmin && ticket.status === 'open') {
      ticket.status = 'pending';
    } else if (isUser && ticket.status === 'pending') {
      ticket.status = 'open';
    }
    
    // Update last response time
    if (isAdmin) {
      ticket.last_response_at = new Date();
    }

    await ticket.save({ session });

    // Send email notification
    if (isAdmin) {
      // Notify user
      await Notification.create([{
        user_id: ticket.user_id,
        type: 'ticket_response',
        title: 'New Response on Your Ticket',
        message: `Support team responded to your ticket #${ticket.ticket_number}`,
        data: {
          ticket_id: ticket._id,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          message: message.substring(0, 100) + '...'
        },
        priority: 'medium'
      }], { session });

      await sendEmail({
        to: ticket.user_id.email,
        subject: `Response on Ticket #${ticket.ticket_number}`,
        template: 'ticket_response',
        data: {
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          message,
          support_agent: req.user.username,
          ticket_url: `${process.env.FRONTEND_URL}/support/tickets/${ticket._id}`
        }
      });
    } else {
      // Notify support team
      await sendEmail({
        to: process.env.SUPPORT_EMAIL,
        subject: `New Message on Ticket #${ticket.ticket_number}`,
        template: 'ticket_message',
        data: {
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          user: req.user.username,
          message,
          ticket_url: `${process.env.ADMIN_URL}/support/tickets/${ticket._id}`
        }
      });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ MESSAGE ADDED to ticket ${ticket.ticket_number}`);

    res.status(201).json({
      success: true,
      code: 'MESSAGE_ADDED',
      message: 'Message added successfully',
      data: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        message: {
          id: newMessage._id,
          sender_type: newMessage.sender_type,
          message: newMessage.message,
          timestamp: newMessage.timestamp
        },
        ticket_status: ticket.status
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ ADD MESSAGE ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'MESSAGE_ADD_FAILED',
      message: 'Failed to add message',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== CLOSE TICKET ====================
exports.closeTicket = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ticket = req.ticket;
    const userId = req.user.userId;

    // Check authorization
    if (ticket.user_id.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'You can only close your own tickets',
        timestamp: new Date().toISOString()
      });
    }

    // Check if already closed
    if (ticket.status === 'closed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_CLOSED',
        message: 'Ticket is already closed',
        timestamp: new Date().toISOString()
      });
    }

    // Close ticket
    const oldStatus = ticket.status;
    ticket.status = 'closed';
    ticket.closed_at = new Date();
    ticket.closed_by = userId;
    ticket.updated_at = new Date();

    // Add to history
    ticket.update_history.push({
      updated_by: userId,
      updated_at: new Date(),
      old_status: oldStatus,
      new_status: 'closed',
      reason: 'Closed by user'
    });

    await ticket.save({ session });

    // Notify support team
    await sendEmail({
      to: process.env.SUPPORT_EMAIL,
      subject: `Ticket Closed: #${ticket.ticket_number}`,
      template: 'ticket_closed',
      data: {
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        user: req.user.username,
        closed_at: new Date().toISOString()
      }
    });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ TICKET CLOSED: ${ticket.ticket_number} by ${req.user.username}`);

    res.json({
      success: true,
      code: 'TICKET_CLOSED',
      message: 'Ticket closed successfully',
      data: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        closed_at: ticket.closed_at,
        previous_status: oldStatus
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ CLOSE TICKET ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'TICKET_CLOSE_FAILED',
      message: 'Failed to close ticket',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== RATE SUPPORT ====================
exports.rateSupport = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ticket = req.ticket;
    const userId = req.user.userId;
    const { rating, feedback } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_RATING',
        message: 'Rating must be between 1 and 5',
        timestamp: new Date().toISOString()
      });
    }

    // Check authorization
    if (ticket.user_id.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'You can only rate your own tickets',
        timestamp: new Date().toISOString()
      });
    }

    // Check if ticket is closed/resolved
    if (!['closed', 'resolved'].includes(ticket.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TICKET_NOT_COMPLETED',
        message: 'You can only rate completed tickets',
        timestamp: new Date().toISOString()
      });
    }

    // Check if already rated
    if (ticket.rating) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_RATED',
        message: 'You have already rated this ticket',
        timestamp: new Date().toISOString()
      });
    }

    // Add rating
    ticket.rating = rating;
    ticket.feedback = feedback;
    ticket.rated_at = new Date();
    ticket.updated_at = new Date();

    await ticket.save({ session });

    // Update support agent stats if assigned
    if (ticket.assigned_to) {
      await User.findByIdAndUpdate(
        ticket.assigned_to,
        {
          $inc: {
            'stats.support_tickets_rated': 1,
            'stats.support_rating_total': rating
          }
        },
        { session }
      );
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ SUPPORT RATED: ${rating} stars for ticket ${ticket.ticket_number}`);

    res.json({
      success: true,
      code: 'SUPPORT_RATED',
      message: 'Support rating submitted successfully',
      data: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        rating,
        feedback,
        rated_at: ticket.rated_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ RATE SUPPORT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'RATING_FAILED',
      message: 'Failed to submit rating',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: GET ALL TICKETS ====================
exports.getAllTickets = async (req, res) => {
  try {
    const { status, category, priority, assigned_to, page = 1, limit = 50 } = req.query;

    // Build filter
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;
    if (assigned_to) {
      if (assigned_to === 'unassigned') {
        filter.assigned_to = { $exists: false };
      } else {
        filter.assigned_to = new mongoose.Types.ObjectId(assigned_to);
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get tickets with user info
    const tickets = await Ticket.find(filter)
      .populate('user_id', 'username email avatar')
      .populate('assigned_to', 'username')
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Ticket.countDocuments(filter);

    // Get statistics
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
        }
      }
    ]);

    const categoryStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const priorityStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get support agents
    const supportAgents = await User.find({
      role: { $in: ['admin', 'moderator'] },
      'account_status': 'active'
    }).select('username email avatar role').lean();

    console.log(`👑 ADMIN: Found ${tickets.length} tickets`);

    res.json({
      success: true,
      code: 'ADMIN_TICKETS_FETCHED',
      message: 'Tickets fetched for admin',
      data: {
        tickets: tickets.map(t => formatTicketResponse(t)),
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        },
        statistics: stats[0] || {
          total: 0, open: 0, pending: 0, resolved: 0, closed: 0
        },
        category_stats: categoryStats,
        priority_stats: priorityStats,
        support_agents: supportAgents,
        filters: {
          status: status || 'all',
          category: category || 'all',
          priority: priority || 'all',
          assigned_to: assigned_to || 'all'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ADMIN GET TICKETS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_TICKETS_ERROR',
      message: 'Failed to fetch tickets for admin',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: ASSIGN TICKET ====================
exports.assignTicket = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ticket = req.ticket;
    const { agent_id, notes } = req.body;
    const adminId = req.user.userId;

    // Validate agent
    const agent = await User.findById(agent_id).session(session);
    if (!agent || !['admin', 'moderator'].includes(agent.role)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_AGENT',
        message: 'Invalid support agent',
        timestamp: new Date().toISOString()
      });
    }

    // Check if already assigned
    if (ticket.assigned_to && ticket.assigned_to.toString() === agent_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_ASSIGNED',
        message: 'Ticket already assigned to this agent',
        timestamp: new Date().toISOString()
      });
    }

    // Update ticket
    const previousAgent = ticket.assigned_to;
    ticket.assigned_to = agent_id;
    ticket.assigned_at = new Date();
    ticket.assigned_by = adminId;
    ticket.updated_at = new Date();

    // Add message
    ticket.messages.push({
      sender_type: 'system',
      message: `Ticket assigned to ${agent.username} by ${req.user.username}`,
      system_action: 'assignment',
      timestamp: new Date()
    });

    // Add to history
    ticket.update_history.push({
      updated_by: adminId,
      updated_at: new Date(),
      action: 'assigned',
      from: previousAgent,
      to: agent_id,
      notes
    });

    await ticket.save({ session });

    // Notify agent
    await Notification.create([{
      user_id: agent_id,
      type: 'ticket_assigned',
      title: 'New Ticket Assigned',
      message: `Ticket #${ticket.ticket_number} has been assigned to you`,
      data: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        priority: ticket.priority,
        assigned_by: req.user.username
      },
      priority: 'high'
    }], { session });

    // Notify user
    await Notification.create([{
      user_id: ticket.user_id,
      type: 'ticket_assigned_to_agent',
      title: 'Ticket Assigned to Support Agent',
      message: `Your ticket #${ticket.ticket_number} has been assigned to our support team`,
      data: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        assigned_to: agent.username
      },
      priority: 'medium'
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`👑 TICKET ASSIGNED: ${ticket.ticket_number} to ${agent.username}`);

    res.json({
      success: true,
      code: 'TICKET_ASSIGNED',
      message: 'Ticket assigned successfully',
      data: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        assigned_to: {
          id: agent._id,
          username: agent.username,
          role: agent.role
        },
        assigned_by: req.user.username,
        assigned_at: ticket.assigned_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ ASSIGN TICKET ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ASSIGNMENT_FAILED',
      message: 'Failed to assign ticket',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: UPDATE TICKET STATUS ====================
exports.updateTicketStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ticket = req.ticket;
    const { status, notes } = req.body;
    const adminId = req.user.userId;

    // Validate status
    const validStatuses = ['open', 'pending', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: `Invalid status. Valid: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // Check if status changed
    if (ticket.status === status) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'STATUS_UNCHANGED',
        message: 'Ticket already has this status',
        timestamp: new Date().toISOString()
      });
    }

    // Update ticket
    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updated_at = new Date();

    if (status === 'resolved') {
      ticket.resolved_at = new Date();
      ticket.resolved_by = adminId;
    } else if (status === 'closed') {
      ticket.closed_at = new Date();
      ticket.closed_by = adminId;
    }

    // Add message
    ticket.messages.push({
      sender_type: 'system',
      message: `Ticket status changed from ${oldStatus} to ${status} by ${req.user.username}`,
      system_action: 'status_change',
      timestamp: new Date()
    });

    // Add to history
    ticket.update_history.push({
      updated_by: adminId,
      updated_at: new Date(),
      old_status: oldStatus,
      new_status: status,
      notes
    });

    await ticket.save({ session });

    // Notify user
    await Notification.create([{
      user_id: ticket.user_id,
      type: 'ticket_status_updated',
      title: 'Ticket Status Updated',
      message: `Your ticket #${ticket.ticket_number} status changed to ${status}`,
      data: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        old_status: oldStatus,
        new_status: status,
        updated_by: req.user.username
      },
      priority: 'medium'
    }], { session });

    // Send email
    await sendEmail({
      to: ticket.user_id.email,
      subject: `Ticket #${ticket.ticket_number} Status Updated`,
      template: 'ticket_status_update',
      data: {
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        old_status: oldStatus,
        new_status: status,
        updated_by: req.user.username,
        notes,
        ticket_url: `${process.env.FRONTEND_URL}/support/tickets/${ticket._id}`
      }
    });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`👑 TICKET STATUS UPDATED: ${ticket.ticket_number} ${oldStatus} → ${status}`);

    res.json({
      success: true,
      code: 'TICKET_STATUS_UPDATED',
      message: 'Ticket status updated successfully',
      data: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        status_change: {
          from: oldStatus,
          to: status,
          updated_by: req.user.username,
          updated_at: new Date().toISOString(),
          notes
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ UPDATE TICKET STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'STATUS_UPDATE_FAILED',
      message: 'Failed to update ticket status',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: ADD INTERNAL NOTE ====================
exports.addInternalNote = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ticket = req.ticket;
    const { note, is_visible_to_user } = req.body;
    const adminId = req.user.userId;

    // Add internal note
    if (!ticket.internal_notes) {
      ticket.internal_notes = [];
    }

    ticket.internal_notes.push({
      note,
      added_by: adminId,
      added_at: new Date(),
      is_visible_to_user: is_visible_to_user || false
    });

    ticket.updated_at = new Date();
    await ticket.save({ session });

    // Add message if visible to user
    if (is_visible_to_user) {
      ticket.messages.push({
        sender_type: 'support',
        sender_id: adminId,
        message: `Note from support: ${note}`,
        timestamp: new Date()
      });

      await ticket.save({ session });

      // Notify user
      await Notification.create([{
        user_id: ticket.user_id,
        type: 'ticket_note_added',
        title: 'Note Added to Your Ticket',
        message: `Support team added a note to your ticket #${ticket.ticket_number}`,
        data: {
          ticket_id: ticket._id,
          ticket_number: ticket.ticket_number,
          note: note.substring(0, 100) + '...'
        },
        priority: 'medium'
      }], { session });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`👑 INTERNAL NOTE ADDED to ticket ${ticket.ticket_number}`);

    res.status(201).json({
      success: true,
      code: 'INTERNAL_NOTE_ADDED',
      message: 'Internal note added successfully',
      data: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        note_id: ticket.internal_notes[ticket.internal_notes.length - 1]._id,
        is_visible_to_user,
        added_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ ADD INTERNAL NOTE ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'NOTE_ADD_FAILED',
      message: 'Failed to add internal note',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET SUPPORT STATS ====================
exports.getSupportStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get overall stats
    const overallStats = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          total_tickets: { $sum: 1 },
          open_tickets: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          pending_tickets: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          resolved_tickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed_tickets: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          avg_response_time: { $avg: { $subtract: ['$first_response_at', '$created_at'] } },
          avg_resolution_time: { $avg: { $subtract: ['$resolved_at', '$created_at'] } }
        }
      }
    ]);

    // Get daily stats for last 30 days
    const dailyStats = await Ticket.aggregate([
      {
        $match: {
          created_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          tickets_created: { $sum: 1 },
          tickets_resolved: { 
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } 
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get category distribution
    const categoryStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avg_resolution_time: { 
            $avg: { 
              $cond: [
                { $eq: ['$status', 'resolved'] },
                { $subtract: ['$resolved_at', '$created_at'] },
                null
              ]
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get priority distribution
    const priorityStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          avg_response_time: { 
            $avg: { $subtract: ['$first_response_at', '$created_at'] }
          }
        }
      }
    ]);

    // Get agent performance
    const agentStats = await Ticket.aggregate([
      {
        $match: {
          assigned_to: { $exists: true },
          status: { $in: ['resolved', 'closed'] }
        }
      },
      {
        $group: {
          _id: '$assigned_to',
          tickets_assigned: { $sum: 1 },
          tickets_resolved: { 
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } 
          },
          avg_resolution_time: { 
            $avg: { $subtract: ['$resolved_at', '$assigned_at'] }
          },
          avg_rating: { $avg: '$rating' }
        }
      },
      { $sort: { tickets_resolved: -1 } }
    ]);

    // Populate agent info
    const agentIds = agentStats.map(stat => stat._id);
    const agents = await User.find({ _id: { $in: agentIds } })
      .select('username email avatar role')
      .lean();

    const agentStatsWithInfo = agentStats.map(stat => {
      const agent = agents.find(a => a._id.toString() === stat._id.toString());
      return {
        ...stat,
        agent_info: agent || null
      };
    });

    const stats = overallStats[0] || {
      total_tickets: 0,
      open_tickets: 0,
      pending_tickets: 0,
      resolved_tickets: 0,
      closed_tickets: 0,
      avg_response_time: 0,
      avg_resolution_time: 0
    };

    // Calculate response time in hours
    const avgResponseHours = stats.avg_response_time ? 
      Math.round(stats.avg_response_time / (1000 * 60 * 60) * 100) / 100 : 0;
    
    const avgResolutionHours = stats.avg_resolution_time ? 
      Math.round(stats.avg_resolution_time / (1000 * 60 * 60) * 100) / 100 : 0;

    res.json({
      success: true,
      code: 'SUPPORT_STATS_FETCHED',
      message: 'Support statistics fetched',
      data: {
        overview: {
          total_tickets: stats.total_tickets,
          open_tickets: stats.open_tickets,
          pending_tickets: stats.pending_tickets,
          resolved_tickets: stats.resolved_tickets,
          closed_tickets: stats.closed_tickets,
          resolution_rate: stats.total_tickets > 0 ? 
            ((stats.resolved_tickets + stats.closed_tickets) / stats.total_tickets * 100).toFixed(2) + '%' : '0%',
          avg_response_time: `${avgResponseHours} hours`,
          avg_resolution_time: `${avgResolutionHours} hours`
        },
        daily_stats: dailyStats,
        category_stats: categoryStats.map(stat => ({
          category: stat._id,
          count: stat.count,
          percentage: stats.total_tickets > 0 ? 
            ((stat.count / stats.total_tickets) * 100).toFixed(2) + '%' : '0%',
          avg_resolution_time: stat.avg_resolution_time ? 
            Math.round(stat.avg_resolution_time / (1000 * 60 * 60) * 100) / 100 + ' hours' : 'N/A'
        })),
        priority_stats: priorityStats.map(stat => ({
          priority: stat._id,
          count: stat.count,
          avg_response_time: stat.avg_response_time ? 
            Math.round(stat.avg_response_time / (1000 * 60 * 60) * 100) / 100 + ' hours' : 'N/A'
        })),
        agent_performance: agentStatsWithInfo.map(stat => ({
          agent: stat.agent_info,
          tickets_assigned: stat.tickets_assigned,
          tickets_resolved: stat.tickets_resolved,
          resolution_rate: stat.tickets_assigned > 0 ? 
            ((stat.tickets_resolved / stat.tickets_assigned) * 100).toFixed(2) + '%' : '0%',
          avg_resolution_time: stat.avg_resolution_time ? 
            Math.round(stat.avg_resolution_time / (1000 * 60 * 60) * 100) / 100 + ' hours' : 'N/A',
          avg_rating: stat.avg_rating ? stat.avg_rating.toFixed(2) + ' stars' : 'Not rated'
        })),
        time_period: {
          start_date: thirtyDaysAgo,
          end_date: new Date(),
          days: 30
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ GET SUPPORT STATS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'STATS_FETCH_ERROR',
      message: 'Failed to fetch support statistics',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== HELPER FUNCTIONS ====================
const formatTicketResponse = (ticket) => {
  const formatted = ticket.toObject ? ticket.toObject() : ticket;
  
  return {
    id: formatted._id,
    ticket_number: formatted.ticket_number,
    subject: formatted.subject,
    category: formatted.category,
    priority: formatted.priority,
    status: formatted.status,
    user: formatted.user_id,
    assigned_to: formatted.assigned_to,
    messages: formatted.messages?.map(msg => ({
      id: msg._id,
      sender_type: msg.sender_type,
      sender: msg.sender_type === 'user' ? formatted.user_id : msg.sender_id,
      message: msg.message,
      attachments: msg.attachments || [],
      timestamp: msg.timestamp,
      read: msg.read || false
    })) || [],
    rating: formatted.rating,
    feedback: formatted.feedback,
    created_at: formatted.createdAt,
    updated_at: formatted.updated_at,
    resolved_at: formatted.resolved_at,
    closed_at: formatted.closed_at,
    first_response_at: formatted.first_response_at,
    last_response_at: formatted.last_response_at,
    assigned_at: formatted.assigned_at,
    metadata: formatted.metadata || {},
    internal_notes: formatted.internal_notes?.filter(note => 
      note.is_visible_to_user || req.user?.role !== 'user'
    ) || [],
    update_history: formatted.update_history || []
  };
};
