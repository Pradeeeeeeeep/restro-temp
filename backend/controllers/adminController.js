const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const VALID_STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'completed'];

// POST /api/admin/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { role: 'admin', username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, username });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    next(err);
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

// GET /api/admin/menu
const getMenuItems = async (req, res, next) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/menu
const createMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, categoryId, available } = req.body;
    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'name, price, and categoryId are required' });
    }
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        available: available !== undefined ? available === 'true' || available === true : true,
        image: imageUrl,
      },
      include: { category: true },
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/menu/:id
const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, available, image } = req.body;

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

    const item = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { category: true },
    });
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
  getDashboardStats,
};
