// routes/support.js - COMPLETE SUPPORT SYSTEM ROUTES
const express = require('express');
const router = express.Router();
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');
const supportController = require('../controllers/supportController');

// ==================== PUBLIC ROUTES ====================
// ✅ GET FAQs
router.get('/faqs/list', supportController.getFAQs);

// ✅ GET support categories
router.get('/categories/list', supportController.getCategories);

// ✅ GET knowledge base
router.get('/knowledge-base/all', supportController.getKnowledgeBase);

// ==================== USER PROTECTED ROUTES ====================
// ✅ CREATE support ticket
router.post('/tickets/create', auth, supportController.createTicket);

// ✅ GET user tickets
router.get('/tickets/my', auth, supportController.getMyTickets);

// ✅ GET ticket by ID
router.get('/tickets/:id', auth, supportController.getTicketById);

// ✅ UPDATE ticket
router.put('/tickets/:id/update', auth, supportController.updateTicket);

// ✅ ADD message to ticket
router.post('/tickets/:id/messages/add', auth, supportController.addMessage);

// ✅ CLOSE ticket
router.post('/tickets/:id/close', auth, supportController.closeTicket);

// ✅ RATE support
router.post('/tickets/:id/rate', auth, supportController.rateSupport);

// ==================== ADMIN ROUTES ====================
// ✅ ADMIN: Get all tickets
router.get('/admin/tickets/all', adminAuth, supportController.getAllTickets);

// ✅ ADMIN: Get ticket statistics
router.get('/admin/statistics', adminAuth, supportController.getSupportStats);

// ✅ ADMIN: Assign ticket
router.post('/admin/tickets/:id/assign', adminAuth, supportController.assignTicket);

// ✅ ADMIN: Update ticket status
router.put('/admin/tickets/:id/status', adminAuth, supportController.updateTicketStatus);

// ✅ ADMIN: Add internal note
router.post('/admin/tickets/:id/notes/add', adminAuth, supportController.addInternalNote);

// ==================== VALIDATION MIDDLEWARE ====================
router.param('id', async (req, res, next, id) => {
  try {
    const Ticket = require('../models/Ticket');
    const ticket = await Ticket.findById(id)
      .populate('user_id', 'username email avatar')
      .populate('assigned_to', 'username');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        code: 'TICKET_NOT_FOUND',
        message: 'Ticket not found',
        timestamp: new Date().toISOString()
      });
    }
    
    req.ticket = ticket;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: 'Invalid ticket ID',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
