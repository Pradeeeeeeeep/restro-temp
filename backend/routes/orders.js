const express = require('express');
const router = express.Router();
const { placeOrder, getOrder, getCustomerOrders } = require('../controllers/orderController');

// POST /api/orders
router.post('/', placeOrder);

// GET /api/orders/customer/:phone  ← must be BEFORE /:id
router.get('/customer/:phone', getCustomerOrders);

// GET /api/orders/:id
router.get('/:id', getOrder);

module.exports = router;
