const prisma = require('../prismaClient');

// GET /api/menu — all available items grouped by category
const getMenu = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { available: true },
          orderBy: { name: 'asc' },
        },
      },
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/all — all items (for admin)
const getAllItems = async (req, res, next) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: { id: 'desc' },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMenu, getAllItems };
