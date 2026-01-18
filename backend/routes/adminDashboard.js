const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');

router.get('/', adminAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 0,
      totalMatches: 0,
      totalRevenue: 0,
      pendingWithdrawals: 0
    }
  });
});

module.exports = router;