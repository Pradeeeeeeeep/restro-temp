const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const VALID_STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
const SETTINGS_PATH = path.join(__dirname, '../settings.json');

const readSettings = () => {
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); }
  catch { return { googleReviewLink: '', showReviewBanner: false }; }
};
const writeSettings = (data) => fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));

// POST /api/admin/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    // Check env master admin credentials
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { role: 'admin', username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, username, isMasterEnv: true });
    }

    // Check DB AdminUser table
    const dbAdmin = await prisma.adminUser.findUnique({ where: { username } });
    if (dbAdmin && dbAdmin.password === password) {
      const token = jwt.sign(
        { role: 'admin', username: dbAdmin.username, id: dbAdmin.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, username: dbAdmin.username, name: dbAdmin.name });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users — List all DB admins
const getAdmins = async (req, res) => {
  try {
    const admins = await prisma.adminUser.findMany({
      select: { id: true, username: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
};

// POST /api/admin/users — Create new admin
const createAdmin = async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !username.trim()) return res.status(400).json({ error: 'Username is required' });
    if (!password || !password.trim()) return res.status(400).json({ error: 'Password is required' });

    const existing = await prisma.adminUser.findUnique({ where: { username: username.trim() } });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const newAdmin = await prisma.adminUser.create({
      data: {
        username: username.trim(),
        password: password.trim(),
        name: name ? name.trim() : null,
      },
      select: { id: true, username: true, name: true, createdAt: true },
    });

    res.status(201).json({ success: true, admin: newAdmin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create admin user' });
  }
};

// DELETE /api/admin/users/:id — Delete admin user
const deleteAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.adminUser.delete({ where: { id } });
    res.json({ success: true, message: 'Admin user deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete admin user' });
  }
};

// GET /api/admin/orders
const getOrders = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const where = {};
    if (status && VALID_STATUSES.includes(status)) where.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: { include: { menuItem: true } },
      },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updateData = {};
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      updateData.status = status;
    }
    if (paymentStatus) {
      if (!['pending', 'paid'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'paymentStatus must be pending or paid' });
      }
      updateData.paymentStatus = paymentStatus;
    }

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { customer: true, items: { include: { menuItem: true } } },
    });
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

const parseCustomizations = (cust) => {
  if (!cust) return [];
  if (Array.isArray(cust)) return cust;
  if (typeof cust === 'string') {
    try {
      const parsed = JSON.parse(cust);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
};

// GET /api/admin/menu
const getMenuItems = async (req, res, next) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    });
    const cleanItems = items.map((item) => ({
      ...item,
      customizations: parseCustomizations(item.customizations),
    }));
    res.json({ items: cleanItems });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/menu
const createMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, categoryId, available, customizations } = req.body;
    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'name, price, and categoryId are required' });
    }
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    let parsedCustomizations = null;
    if (customizations) {
      try {
        parsedCustomizations = typeof customizations === 'string' ? JSON.parse(customizations) : customizations;
      } catch {}
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        available: available !== undefined ? available === 'true' || available === true : true,
        image: imageUrl,
        customizations: parsedCustomizations,
      },
      include: { category: true },
    });
    item.customizations = parseCustomizations(item.customizations);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/menu/:id
const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, available, image, customizations } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (available !== undefined) updateData.available = available === 'true' || available === true;
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    } else if (image !== undefined) {
      updateData.image = image;
    }

    if (customizations !== undefined) {
      try {
        updateData.customizations = typeof customizations === 'string' ? JSON.parse(customizations) : customizations;
      } catch {}
    }

    const item = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { category: true },
    });
    item.customizations = parseCustomizations(item.customizations);
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/menu/:id
const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const category = await prisma.category.create({
      data: { name, sortOrder: sortOrder ? parseInt(sortOrder) : 0 },
    });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/categories/:id — rename a category
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name, ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }) },
    });
    res.json({ category });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const itemCount = await prisma.menuItem.count({ where: { categoryId: parseInt(id) } });
    if (itemCount > 0) {
      return res.status(400).json({ error: `Cannot delete: ${itemCount} menu item${itemCount !== 1 ? 's' : ''} belong to this category. Reassign or delete them first.` });
    }
    await prisma.category.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.order.count({ where: { status: { in: ['placed', 'accepted', 'preparing'] } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: 'completed' } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: today, lt: tomorrow }, status: 'completed' },
      }),
    ]);

    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    res.json({
      stats: {
        totalOrders,
        todayOrders,
        pendingOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        todayRevenue: todayRevenue._sum.total || 0,
        ordersByStatus: ordersByStatus.reduce((acc, s) => {
          acc[s.status] = s._count.status;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/settings  (also used publicly)
const getSettings = (req, res) => {
  res.json({ settings: readSettings() });
};

// PUT /api/admin/settings
const updateSettings = (req, res) => {
  const current = readSettings();
  const updated = { ...current, ...req.body };
  writeSettings(updated);
  res.json({ settings: updated });
};

// POST /api/admin/settings/logo
const uploadLogo = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const logoUrl = `/uploads/${req.file.filename}`;
    const current = readSettings();
    const updated = { ...current, cafeLogoUrl: logoUrl };
    writeSettings(updated);
    res.json({ logoUrl, settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
};

// GET /api/admin/coupons
const getAdminCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ coupons });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/coupons
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, active } = req.body;
    if (!code || !discountValue) {
      return res.status(400).json({ error: 'code and discountValue are required' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType: discountType || 'fixed',
        discountValue: parseFloat(discountValue),
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        active: active !== undefined ? active === true || active === 'true' : true,
      },
    });
    res.status(201).json({ coupon });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Coupon code already exists' });
    next(err);
  }
};

// PUT /api/admin/coupons/:id
const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, active } = req.body;

    const updateData = {};
    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
    if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount);
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (active !== undefined) updateData.active = active === true || active === 'true';

    const coupon = await prisma.coupon.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    res.json({ coupon });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/coupons/:id
const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
  getAdmins,
  createAdmin,
  deleteAdmin,
};
