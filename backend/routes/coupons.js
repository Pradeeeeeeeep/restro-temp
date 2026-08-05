const express = require('express');
const router = express.Router();
const { getCoupons, validateCoupon } = require('../controllers/couponController');

// GET /api/coupons
router.get('/', getCoupons);

// POST /api/coupons/validate
router.post('/validate', validateCoupon);

module.exports = router;
