require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const customerRoutes = require('./routes/customer');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');
const remoteRoutes = require('./routes/remote');
const comboRoutes = require('./routes/combos');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Café API is running ☕' });
});

// Routes
app.use('/api/customer', customerRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/remote', remoteRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/reviews', reviewRoutes);

// Public settings (no auth — used by customer-facing pages)
const { getSettings } = require('./controllers/adminController');
app.get('/api/settings', getSettings);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`☕ Café server running on http://localhost:${PORT}`);
});
