const express = require('express');
const router = express.Router();
const { getPublicReviews } = require('../controllers/reviewController');

router.get('/', getPublicReviews);

module.exports = router;
