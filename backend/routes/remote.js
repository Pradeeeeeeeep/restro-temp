const express = require('express');
const router = express.Router();
const { getRemoteThemeConfig, updateRemoteThemeConfig } = require('../controllers/remoteController');

// Public read remote theme config
router.get('/theme', getRemoteThemeConfig);

// Protected remote site update
router.post('/theme', updateRemoteThemeConfig);
router.put('/theme', updateRemoteThemeConfig);

module.exports = router;
