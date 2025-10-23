const express = require('express');
const router = express.Router();

// Temporary routes
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Get all users - working!' 
  });
});

router.get('/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: `Get user ${req.params.id} - working!` 
  });
});

module.exports = router;
