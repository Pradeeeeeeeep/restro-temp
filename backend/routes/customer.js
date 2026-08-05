const express = require('express');
const router = express.Router();
const { upsertCustomer } = require('../controllers/customerController');

// POST /api/customer
router.post('/', upsertCustomer);

module.exports = router;
