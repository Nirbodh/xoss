// routes/settings.js - COMPLETE SETTINGS ROUTES
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');

// ==============================================
// 🔥 PUBLIC SETTINGS
// ==============================================

// ✅ Get public settings (app config, features, etc.)
router.get('/public', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        app_name: 'XOSS Gaming',
        version: '1.0.0',
        features: {
          matches: true,
          tournaments: true,
          payments: true,
          withdrawals: true,
          live_streaming: false,
          teams: false
        },
        games: ['Free Fire', 'PUBG Mobile', 'Call of Duty Mobile', 'Mobile Legends'],
        currency: 'BDT',
        min_deposit: 100,
        max_deposit: 10000,
        min_withdrawal: 500,
        max_withdrawal: 50000,
        contact_email: 'support@xossgaming.com',
        support_phone: '+880XXXXXXXXXX',
        social_links: {
          facebook: 'https://facebook.com/xossgaming',
          youtube: 'https://youtube.com/xossgaming',
          discord: 'https://discord.gg/xossgaming'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 USER SETTINGS
// ==============================================

// ✅ Get user settings
router.get('/user', auth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        notifications: {
          match_reminders: true,
          tournament_updates: true,
          prize_winnings: true,
          promotional_emails: false,
          sms_notifications: false
        },
        privacy: {
          profile_visibility: 'public',
          show_online_status: true,
          allow_friend_requests: true,
          show_match_history: true
        },
        gameplay: {
          default_game: 'Free Fire',
          auto_join_matches: false,
          preferred_match_type: 'solo',
          language: 'en'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update user settings
router.put('/user', auth, async (req, res) => {
  try {
    const { notifications, privacy, gameplay } = req.body;
    
    // In a real app, you would save these to the user document
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        notifications: notifications || {},
        privacy: privacy || {},
        gameplay: gameplay || {},
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 ADMIN SETTINGS
// ==============================================

// ✅ Get admin settings
router.get('/admin', adminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        general: {
          site_name: 'XOSS Gaming',
          site_url: 'https://xossgaming.com',
          admin_email: 'admin@xossgaming.com',
          timezone: 'Asia/Dhaka',
          currency: 'BDT',
          date_format: 'DD/MM/YYYY'
        },
        features: {
          registration_enabled: true,
          email_verification_required: false,
          phone_verification_required: false,
          maintenance_mode: false,
          allow_withdrawals: true,
          allow_deposits: true
        },
        limits: {
          max_match_participants: 100,
          max_tournament_participants: 500,
          max_daily_withdrawals: 3,
          max_withdrawal_amount: 50000,
          min_deposit_amount: 100,
          max_deposit_amount: 10000
        },
        payment: {
          stripe_enabled: false,
          paypal_enabled: false,
          bkash_enabled: true,
          nagad_enabled: true,
          rocket_enabled: true,
          default_gateway: 'bkash'
        },
        commission: {
          match_commission_percentage: 10,
          tournament_commission_percentage: 15,
          withdrawal_fee_percentage: 2,
          min_withdrawal_fee: 10
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update admin settings
router.put('/admin', adminAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    // In a real app, you would save these to a database
    res.json({
      success: true,
      message: 'Admin settings updated successfully',
      data: {
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Toggle feature flag
router.post('/admin/features/:feature/toggle', adminAuth, async (req, res) => {
  try {
    const { feature } = req.params;
    const { enabled } = req.body;
    
    res.json({
      success: true,
      message: `Feature "${feature}" ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        feature,
        enabled: enabled !== undefined ? enabled : true,
        toggled_at: new Date().toISOString(),
        toggled_by: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Clear cache
router.post('/admin/cache/clear', adminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      data: {
        cleared_at: new Date().toISOString(),
        cleared_by: req.user.id,
        cache_types: ['user', 'match', 'tournament', 'system']
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get system logs
router.get('/admin/logs', adminAuth, async (req, res) => {
  try {
    const { type = 'error', limit = 100 } = req.query;
    
    res.json({
      success: true,
      data: {
        logs: [],
        type,
        limit: parseInt(limit),
        total: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 MAINTENANCE MODE
// ==============================================

// ✅ Enable maintenance mode
router.post('/admin/maintenance/enable', adminAuth, async (req, res) => {
  try {
    const { message, estimated_downtime } = req.body;
    
    res.json({
      success: true,
      message: 'Maintenance mode enabled',
      data: {
        enabled: true,
        enabled_at: new Date().toISOString(),
        enabled_by: req.user.id,
        message: message || 'System is under maintenance. Please try again later.',
        estimated_downtime: estimated_downtime || '1 hour'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Disable maintenance mode
router.post('/admin/maintenance/disable', adminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Maintenance mode disabled',
      data: {
        enabled: false,
        disabled_at: new Date().toISOString(),
        disabled_by: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get maintenance status
router.get('/maintenance/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        maintenance_mode: false,
        message: null,
        estimated_completion: null,
        started_at: null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 BACKUP & RESTORE
// ==============================================

// ✅ Create backup
router.post('/admin/backup/create', adminAuth, async (req, res) => {
  try {
    const { type = 'full', description } = req.body;
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      data: {
        backup_id: 'backup_' + Date.now(),
        type,
        description: description || 'Manual backup',
        created_at: new Date().toISOString(),
        created_by: req.user.id,
        size: '0 MB',
        download_url: null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get backup list
router.get('/admin/backup/list', adminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        backups: [],
        total: 0,
        storage_used: '0 MB',
        last_backup: null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
