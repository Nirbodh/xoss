// routes/utility.js - UTILITY & HELPER ROUTES
const express = require('express');
const router = express.Router();
const { auth, adminAuth, optionalAuth, apiKeyAuth } = require('../middleware/auth');
const utilityController = require('../controllers/utilityController');

// ==================== PUBLIC UTILITIES ====================
// ✅ GENERATE UUID
router.get('/uuid/generate', utilityController.generateUUID);

// ✅ HASH string
router.post('/hash/generate', utilityController.generateHash);

// ✅ VALIDATE email
router.post('/validate/email', utilityController.validateEmail);

// ✅ VALIDATE phone
router.post('/validate/phone', utilityController.validatePhone);

// ✅ FORMAT currency
router.post('/format/currency', utilityController.formatCurrency);

// ✅ GENERATE random string
router.get('/random/string', utilityController.generateRandomString);

// ✅ GENERATE random number
router.get('/random/number', utilityController.generateRandomNumber);

// ✅ GET timestamp
router.get('/timestamp', utilityController.getTimestamp);

// ✅ GET server time
router.get('/time/server', utilityController.getServerTime);

// ✅ GET timezone list
router.get('/timezones/list', utilityController.getTimezones);

// ✅ CONVERT timezone
router.post('/timezone/convert', utilityController.convertTimezone);

// ✅ CALCULATE age
router.post('/calculate/age', utilityController.calculateAge);

// ✅ CALCULATE date difference
router.post('/calculate/date-diff', utilityController.calculateDateDifference);

// ==================== VALIDATION UTILITIES ====================
// ✅ VALIDATE password strength
router.post('/validate/password', utilityController.validatePasswordStrength);

// ✅ VALIDATE username
router.post('/validate/username', utilityController.validateUsername);

// ✅ VALIDATE URL
router.post('/validate/url', utilityController.validateURL);

// ✅ VALIDATE IP address
router.post('/validate/ip', utilityController.validateIPAddress);

// ✅ VALIDATE credit card
router.post('/validate/credit-card', utilityController.validateCreditCard);

// ✅ VALIDATE domain
router.post('/validate/domain', utilityController.validateDomain);

// ==================== CONVERSION UTILITIES ====================
// ✅ CONVERT currency
router.post('/convert/currency', utilityController.convertCurrency);

// ✅ CONVERT units
router.post('/convert/units', utilityController.convertUnits);

// ✅ CONVERT image format
router.post('/convert/image', utilityController.convertImageFormat);

// ✅ COMPRESS image
router.post('/compress/image', utilityController.compressImage);

// ✅ RESIZE image
router.post('/resize/image', utilityController.resizeImage);

// ==================== ENCRYPTION & SECURITY ====================
// ✅ ENCRYPT text
router.post('/encrypt/text', utilityController.encryptText);

// ✅ DECRYPT text
router.post('/decrypt/text', utilityController.decryptText);

// ✅ GENERATE JWT token
router.post('/jwt/generate', utilityController.generateJWT);

// ✅ VERIFY JWT token
router.post('/jwt/verify', utilityController.verifyJWT);

// ✅ GENERATE API key
router.post('/api-key/generate', utilityController.generateAPIKey);

// ✅ VERIFY API key
router.post('/api-key/verify', utilityController.verifyAPIKey);

// ==================== FILE UTILITIES ====================
// ✅ GET file info
router.post('/file/info', utilityController.getFileInfo);

// ✅ CALCULATE file hash
router.post('/file/hash', utilityController.calculateFileHash);

// ✅ VALIDATE file type
router.post('/file/validate', utilityController.validateFileType);

// ✅ GENERATE file preview
router.post('/file/preview', utilityController.generateFilePreview);

// ✅ EXTRACT metadata
router.post('/file/metadata', utilityController.extractMetadata);

// ==================== TEXT UTILITIES ====================
// ✅ COUNT words
router.post('/text/count-words', utilityController.countWords);

// ✅ COUNT characters
router.post('/text/count-characters', utilityController.countCharacters);

// ✅ CONVERT case
router.post('/text/convert-case', utilityController.convertCase);

// ✅ GENERATE slug
router.post('/text/generate-slug', utilityController.generateSlug);

// ✅ EXTRACT keywords
router.post('/text/extract-keywords', utilityController.extractKeywords);

// ✅ SUMMARIZE text
router.post('/text/summarize', utilityController.summarizeText);

// ==================== DATA UTILITIES ====================
// ✅ FORMAT JSON
router.post('/data/format-json', utilityController.formatJSON);

// ✅ VALIDATE JSON
router.post('/data/validate-json', utilityController.validateJSON);

// ✅ CONVERT CSV to JSON
router.post('/data/csv-to-json', utilityController.convertCSVtoJSON);

// ✅ CONVERT JSON to CSV
router.post('/data/json-to-csv', utilityController.convertJSONtoCSV);

// ✅ GENERATE QR code
router.post('/data/generate-qrcode', utilityController.generateQRCode);

// ✅ READ QR code
router.post('/data/read-qrcode', utilityController.readQRCode);

// ==================== NETWORK UTILITIES ====================
// ✅ PING IP/host
router.post('/network/ping', utilityController.pingHost);

// ✅ TRACEROUTE
router.post('/network/traceroute', utilityController.traceroute);

// ✅ GET DNS records
router.post('/network/dns', utilityController.getDNSRecords);

// ✅ CHECK port
router.post('/network/port-check', utilityController.checkPort);

// ✅ GET WHOIS info
router.post('/network/whois', utilityController.getWhoisInfo);

// ==================== LOCATION UTILITIES ====================
// ✅ GET geolocation
router.post('/location/geolocate', utilityController.geolocateIP);

// ✅ GET address info
router.post('/location/address', utilityController.getAddressInfo);

// ✅ CALCULATE distance
router.post('/location/distance', utilityController.calculateDistance);

// ✅ GET timezone by location
router.post('/location/timezone', utilityController.getTimezoneByLocation);

// ✅ GET weather info
router.post('/location/weather', utilityController.getWeatherInfo);

// ==================== GAMING UTILITIES ====================
// ✅ CALCULATE K/D ratio
router.post('/gaming/calculate-kd', utilityController.calculateKDRatio);

// ✅ CALCULATE win rate
router.post('/gaming/calculate-winrate', utilityController.calculateWinRate);

// ✅ CALCULATE prize distribution
router.post('/gaming/calculate-prizes', utilityController.calculatePrizeDistribution);

// ✅ GENERATE room code
router.get('/gaming/generate-room-code', utilityController.generateRoomCode);

// ✅ GENERATE team name
router.get('/gaming/generate-team-name', utilityController.generateTeamName);

// ==================== ADMIN UTILITIES ====================
// ✅ GENERATE report
router.post('/admin/report/generate', adminAuth, utilityController.generateReport);

// ✅ SEND test notification
router.post('/admin/notification/test', adminAuth, utilityController.sendTestNotification);

// ✅ TEST email delivery
router.post('/admin/email/test', adminAuth, utilityController.testEmailDelivery);

// ✅ TEST SMS delivery
router.post('/admin/sms/test', adminAuth, utilityController.testSMSDelivery);

// ✅ VALIDATE configuration
router.get('/admin/config/validate', adminAuth, utilityController.validateConfiguration);

// ==================== BATCH OPERATIONS ====================
// ✅ BATCH process
router.post('/batch/process', adminAuth, utilityController.batchProcess);

// ✅ BATCH update
router.post('/batch/update', adminAuth, utilityController.batchUpdate);

// ✅ BATCH delete
router.post('/batch/delete', adminAuth, utilityController.batchDelete);

// ✅ BATCH export
router.post('/batch/export', adminAuth, utilityController.batchExport);

// ✅ BATCH import
router.post('/batch/import', adminAuth, utilityController.batchImport);

// ==================== DEBUG & TESTING ====================
// ✅ DEBUG info
router.get('/debug/info', adminAuth, utilityController.getDebugInfo);

// ✅ TEST database connection
router.get('/debug/database/test', adminAuth, utilityController.testDatabaseConnection);

// ✅ TEST Redis connection
router.get('/debug/redis/test', adminAuth, utilityController.testRedisConnection);

// ✅ TEST external APIs
router.post('/debug/apis/test', adminAuth, utilityController.testExternalAPIs);

// ✅ PERFORMANCE test
router.get('/debug/performance/test', adminAuth, utilityController.runPerformanceTest);

module.exports = router;
