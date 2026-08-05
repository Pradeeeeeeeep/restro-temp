const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');
const {
  login,
  getOrders,
  updateOrderStatus,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getDashboardStats,
  getSettings,
  updateSettings,
  uploadLogo,
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/adminController');

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// Public
router.post('/login', login);

// Protected routes
router.use(authMiddleware);

router.get('/dashboard/stats', getDashboardStats);

router.get('/orders', getOrders);
router.patch('/orders/:id/status', updateOrderStatus);

router.get('/menu', getMenuItems);
router.post('/menu', upload.single('image'), createMenuItem);
router.put('/menu/:id', upload.single('image'), updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/settings/logo', upload.single('logo'), uploadLogo);

router.get('/coupons', getAdminCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

module.exports = router;
