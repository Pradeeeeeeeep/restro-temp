const express = require('express');
const router = express.Router();
const { getPublicCombos } = require('../controllers/comboController');

// Public customer endpoint to fetch active combos
router.get('/', getPublicCombos);

module.exports = router;
