const prisma = require('../prismaClient');

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

    const cleanCategories = categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({
        ...item,
        customizations: parseCustomizations(item.customizations),
      })),
    }));

    res.json({ categories: cleanCategories });
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
    const cleanItems = items.map((item) => ({
      ...item,
      customizations: parseCustomizations(item.customizations),
    }));
    res.json({ items: cleanItems });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMenu, getAllItems };
