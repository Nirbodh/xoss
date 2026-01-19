// routes/system.js - SYSTEM MANAGEMENT ROUTES
const express = require('express');
const router = express.Router();
const { adminAuth, superAdminAuth, apiKeyAuth } = require('../middleware/auth');
const systemController = require('../controllers/systemController');

// ==================== PUBLIC SYSTEM INFO ====================
// ✅ GET system status
router.get('/status', systemController.getSystemStatus);

// ✅ GET server health
router.get('/health', systemController.getHealthStatus);

// ✅ GET API documentation
router.get('/docs', systemController.getAPIDocs);

// ✅ GET system version
router.get('/version', systemController.getSystemVersion);

// ==================== ADMIN SYSTEM MANAGEMENT ====================
// ✅ GET system metrics
router.get('/admin/metrics', adminAuth, systemController.getSystemMetrics);

// ✅ GET database stats
router.get('/admin/database/stats', adminAuth, systemController.getDatabaseStats);

// ✅ GET server logs
router.get('/admin/logs/server', superAdminAuth, systemController.getServerLogs);

// ✅ GET error logs
router.get('/admin/logs/errors', superAdminAuth, systemController.getErrorLogs);

// ✅ GET access logs
router.get('/admin/logs/access', superAdminAuth, systemController.getAccessLogs);

// ✅ CLEAR system cache
router.post('/admin/cache/clear', superAdminAuth, systemController.clearSystemCache);

// ✅ FLUSH Redis cache
router.post('/admin/cache/flush', superAdminAuth, systemController.flushRedisCache);

// ✅ RESTART services
router.post('/admin/services/restart', superAdminAuth, systemController.restartServices);

// ==================== DATABASE MANAGEMENT ====================
// ✅ GET database backup
router.get('/admin/database/backup', superAdminAuth, systemController.createDatabaseBackup);

// ✅ RESTORE database
router.post('/admin/database/restore', superAdminAuth, systemController.restoreDatabase);

// ✅ OPTIMIZE database
router.post('/admin/database/optimize', superAdminAuth, systemController.optimizeDatabase);

// ✅ GET database collections
router.get('/admin/database/collections', superAdminAuth, systemController.getDatabaseCollections);

// ==================== MONITORING & ANALYTICS ====================
// ✅ GET real-time monitoring
router.get('/admin/monitoring/realtime', superAdminAuth, systemController.getRealtimeMonitoring);

// ✅ GET performance metrics
router.get('/admin/performance/metrics', superAdminAuth, systemController.getPerformanceMetrics);

// ✅ GET user activity
router.get('/admin/activity/users', superAdminAuth, systemController.getUserActivity);

// ✅ GET system alerts
router.get('/admin/alerts/list', superAdminAuth, systemController.getSystemAlerts);

// ==================== CONFIGURATION MANAGEMENT ====================
// ✅ GET system configuration
router.get('/admin/config/system', superAdminAuth, systemController.getSystemConfig);

// ✅ UPDATE system configuration
router.put('/admin/config/system', superAdminAuth, systemController.updateSystemConfig);

// ✅ GET environment variables
router.get('/admin/config/env', superAdminAuth, systemController.getEnvironmentVariables);

// ✅ UPDATE environment variable
router.put('/admin/config/env/:key', superAdminAuth, systemController.updateEnvironmentVariable);

// ==================== MAINTENANCE MODE ====================
// ✅ ENABLE maintenance mode
router.post('/admin/maintenance/enable', superAdminAuth, systemController.enableMaintenanceMode);

// ✅ DISABLE maintenance mode
router.post('/admin/maintenance/disable', superAdminAuth, systemController.disableMaintenanceMode);

// ✅ GET maintenance status
router.get('/admin/maintenance/status', adminAuth, systemController.getMaintenanceStatus);

// ==================== SECURITY & AUDIT ====================
// ✅ GET security logs
router.get('/admin/security/logs', superAdminAuth, systemController.getSecurityLogs);

// ✅ GET audit trail
router.get('/admin/audit/trail', superAdminAuth, systemController.getAuditTrail);

// ✅ GET login attempts
router.get('/admin/security/logins', superAdminAuth, systemController.getLoginAttempts);

// ✅ BLOCK IP address
router.post('/admin/security/ip/block', superAdminAuth, systemController.blockIPAddress);

// ✅ UNBLOCK IP address
router.post('/admin/security/ip/unblock', superAdminAuth, systemController.unblockIPAddress);

// ==================== EMAIL & NOTIFICATION SYSTEM ====================
// ✅ SEND test email
router.post('/admin/email/test', superAdminAuth, systemController.sendTestEmail);

// ✅ GET email queue
router.get('/admin/email/queue', superAdminAuth, systemController.getEmailQueue);

// ✅ CLEAR email queue
router.post('/admin/email/queue/clear', superAdminAuth, systemController.clearEmailQueue);

// ✅ SEND bulk notification
router.post('/admin/notification/bulk', superAdminAuth, systemController.sendBulkNotification);

// ==================== API MANAGEMENT ====================
// ✅ GET API keys
router.get('/admin/api/keys', superAdminAuth, systemController.getAPIKeys);

// ✅ CREATE API key
router.post('/admin/api/keys/create', superAdminAuth, systemController.createAPIKey);

// ✅ REVOKE API key
router.delete('/admin/api/keys/:key', superAdminAuth, systemController.revokeAPIKey);

// ✅ GET API usage stats
router.get('/admin/api/stats', superAdminAuth, systemController.getAPIUsageStats);

// ==================== THIRD-PARTY INTEGRATIONS ====================
// ✅ TEST payment gateway
router.post('/admin/integrations/payment/test', superAdminAuth, systemController.testPaymentGateway);

// ✅ TEST SMS gateway
router.post('/admin/integrations/sms/test', superAdminAuth, systemController.testSMSGateway);

// ✅ GET integration status
router.get('/admin/integrations/status', superAdminAuth, systemController.getIntegrationStatus);

// ==================== AUTOMATED TASKS ====================
// ✅ RUN cron jobs manually
router.post('/admin/tasks/cron/run', superAdminAuth, systemController.runCronJob);

// ✅ GET scheduled tasks
router.get('/admin/tasks/scheduled', superAdminAuth, systemController.getScheduledTasks);

// ✅ EXECUTE database cleanup
router.post('/admin/tasks/cleanup/database', superAdminAuth, systemController.executeDatabaseCleanup);

// ✅ EXECUTE cache cleanup
router.post('/admin/tasks/cleanup/cache', superAdminAuth, systemController.executeCacheCleanup);

module.exports = router;
