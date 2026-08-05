const express = require('express');
const router = express.Router();
const { getMenu } = require('../controllers/menuController');

// GET /api/menu
router.get('/', getMenu);

module.exports = router;
