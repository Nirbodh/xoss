const express = require('express');
const router = express.Router();

router.get('/:userId', (req, res) => {
  res.json({
    success: true,
    data: {
      referralCode: 'XOSS' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      referredUsers: 0,
      totalEarnings: 0
    }
  });
});

module.exports = router;