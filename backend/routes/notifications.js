const express = require('express');
const router = express.Router();

// Temporary routes
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Get notifications - working!',
    notifications: []
  });
});

module.exports = router;
