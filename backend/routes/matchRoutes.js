// routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

router.post('/', matchController.createMatch);
router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);
router.put('/:id', matchController.updateMatch);
router.delete('/:id', matchController.deleteMatch);
router.put('/:id/status', matchController.updateMatchStatus);

module.exports = router;
