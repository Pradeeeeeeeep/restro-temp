const express = require('express');
const router = express.Router();
const { placeOrder, getOrder, getCustomerOrders } = require('../controllers/orderController');

// POST /api/orders
router.post('/', placeOrder);

// GET /api/orders/:id
router.get('/:id', getOrder);

// GET /api/orders/customer/:phone
router.get('/customer/:phone', getCustomerOrders);

module.exports = router;
