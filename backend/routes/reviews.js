const express = require('express');
const router = express.Router();
const { getPublicReviews, createPublicReview } = require('../controllers/reviewController');

router.get('/', getPublicReviews);
router.post('/', createPublicReview);

module.exports = router;
