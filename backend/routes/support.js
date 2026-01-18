const express = require('express');
const router = express.Router();

router.post('/ticket', (req, res) => {
  res.json({
    success: true,
    message: 'Ticket created',
    ticketNumber: 'TKT' + Date.now()
  });
});

module.exports = router;