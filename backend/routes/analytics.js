// routes/analytics.js - ANALYTICS & REPORTING ROUTES
const express = require('express');
const router = express.Router();
const { adminAuth, superAdminAuth } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// ==================== PUBLIC ANALYTICS ====================
// ✅ GET platform statistics
router.get('/platform/stats', analyticsController.getPlatformStats);

// ✅ GET tournament statistics
router.get('/tournaments/stats', analyticsController.getTournamentStats);

// ✅ GET match statistics
router.get('/matches/stats', analyticsController.getMatchStats);

// ==================== ADMIN ANALYTICS DASHBOARD ====================
// ✅ GET dashboard overview
router.get('/admin/dashboard/overview', adminAuth, analyticsController.getDashboardOverview);

// ✅ GET real-time analytics
router.get('/admin/analytics/realtime', adminAuth, analyticsController.getRealtimeAnalytics);

// ✅ GET daily analytics
router.get('/admin/analytics/daily', adminAuth, analyticsController.getDailyAnalytics);

// ✅ GET weekly analytics
router.get('/admin/analytics/weekly', adminAuth, analyticsController.getWeeklyAnalytics);

// ✅ GET monthly analytics
router.get('/admin/analytics/monthly', adminAuth, analyticsController.getMonthlyAnalytics);

// ==================== USER ANALYTICS ====================
// ✅ GET user growth analytics
router.get('/admin/users/growth', adminAuth, analyticsController.getUserGrowthAnalytics);

// ✅ GET user retention
router.get('/admin/users/retention', adminAuth, analyticsController.getUserRetention);

// ✅ GET user activity
router.get('/admin/users/activity', adminAuth, analyticsController.getUserActivityAnalytics);

// ✅ GET user demographics
router.get('/admin/users/demographics', adminAuth, analyticsController.getUserDemographics);

// ==================== FINANCIAL ANALYTICS ====================
// ✅ GET revenue analytics
router.get('/admin/financial/revenue', adminAuth, analyticsController.getRevenueAnalytics);

// ✅ GET withdrawal analytics
router.get('/admin/financial/withdrawals', adminAuth, analyticsController.getWithdrawalAnalytics);

// ✅ GET deposit analytics
router.get('/admin/financial/deposits', adminAuth, analyticsController.getDepositAnalytics);

// ✅ GET prize distribution analytics
router.get('/admin/financial/prizes', adminAuth, analyticsController.getPrizeDistributionAnalytics);

// ✅ GET commission analytics
router.get('/admin/financial/commissions', adminAuth, analyticsController.getCommissionAnalytics);

// ==================== GAMING ANALYTICS ====================
// ✅ GET game popularity
router.get('/admin/gaming/popularity', adminAuth, analyticsController.getGamePopularity);

// ✅ GET tournament performance
router.get('/admin/gaming/tournaments', adminAuth, analyticsController.getTournamentPerformance);

// ✅ GET match performance
router.get('/admin/gaming/matches', adminAuth, analyticsController.getMatchPerformance);

// ✅ GET player performance
router.get('/admin/gaming/players', adminAuth, analyticsController.getPlayerPerformance);

// ==================== CONTENT ANALYTICS ====================
// ✅ GET content engagement
router.get('/admin/content/engagement', adminAuth, analyticsController.getContentEngagement);

// ✅ GET post analytics
router.get('/admin/content/posts', adminAuth, analyticsController.getPostAnalytics);

// ✅ GET comment analytics
router.get('/admin/content/comments', adminAuth, analyticsController.getCommentAnalytics);

// ✅ GET media analytics
router.get('/admin/content/media', adminAuth, analyticsController.getMediaAnalytics);

// ==================== MARKETING ANALYTICS ====================
// ✅ GET referral analytics
router.get('/admin/marketing/referrals', adminAuth, analyticsController.getReferralAnalytics);

// ✅ GET campaign analytics
router.get('/admin/marketing/campaigns', adminAuth, analyticsController.getCampaignAnalytics);

// ✅ GET conversion analytics
router.get('/admin/marketing/conversions', adminAuth, analyticsController.getConversionAnalytics);

// ✅ GET acquisition analytics
router.get('/admin/marketing/acquisition', adminAuth, analyticsController.getAcquisitionAnalytics);

// ==================== PERFORMANCE ANALYTICS ====================
// ✅ GET system performance
router.get('/admin/performance/system', adminAuth, analyticsController.getSystemPerformance);

// ✅ GET API performance
router.get('/admin/performance/api', adminAuth, analyticsController.getAPIPerformance);

// ✅ GET database performance
router.get('/admin/performance/database', adminAuth, analyticsController.getDatabasePerformance);

// ✅ GET server performance
router.get('/admin/performance/server', adminAuth, analyticsController.getServerPerformance);

// ==================== GEOGRAPHICAL ANALYTICS ====================
// ✅ GET geographical distribution
router.get('/admin/geographical/distribution', adminAuth, analyticsController.getGeographicalDistribution);

// ✅ GET regional performance
router.get('/admin/geographical/regions', adminAuth, analyticsController.getRegionalPerformance);

// ✅ GET country analytics
router.get('/admin/geographical/countries', adminAuth, analyticsController.getCountryAnalytics);

// ✅ GET city analytics
router.get('/admin/geographical/cities', adminAuth, analyticsController.getCityAnalytics);

// ==================== DEVICE ANALYTICS ====================
// ✅ GET device distribution
router.get('/admin/devices/distribution', adminAuth, analyticsController.getDeviceDistribution);

// ✅ GET platform distribution
router.get('/admin/devices/platforms', adminAuth, analyticsController.getPlatformDistribution);

// ✅ GET browser analytics
router.get('/admin/devices/browsers', adminAuth, analyticsController.getBrowserAnalytics);

// ==================== EXPORT ANALYTICS ====================
// ✅ EXPORT analytics data
router.post('/admin/export/data', adminAuth, analyticsController.exportAnalyticsData);

// ✅ GENERATE analytics report
router.post('/admin/reports/generate', adminAuth, analyticsController.generateAnalyticsReport);

// ✅ DOWNLOAD analytics report
router.get('/admin/reports/download/:id', adminAuth, analyticsController.downloadAnalyticsReport);

// ==================== CUSTOM REPORTS ====================
// ✅ CREATE custom report
router.post('/admin/reports/custom/create', adminAuth, analyticsController.createCustomReport);

// ✅ GET custom reports
router.get('/admin/reports/custom/list', adminAuth, analyticsController.getCustomReports);

// ✅ DELETE custom report
router.delete('/admin/reports/custom/:id', adminAuth, analyticsController.deleteCustomReport);

// ==================== PREDICTIVE ANALYTICS ====================
// ✅ GET predictions
router.get('/admin/predictions/trends', superAdminAuth, analyticsController.getPredictionTrends);

// ✅ GET forecasting
router.get('/admin/predictions/forecasting', superAdminAuth, analyticsController.getForecasting);

// ✅ GET recommendations
router.get('/admin/predictions/recommendations', superAdminAuth, analyticsController.getRecommendations);

module.exports = router;
