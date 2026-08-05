const prisma = require('../prismaClient');

const VALID_PAYMENT_METHODS = ['cash', 'cafe', 'online'];
const VALID_STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'completed'];

// POST /api/orders — place a new order
const placeOrder = async (req, res, next) => {
  try {
    const { customerId, items, paymentMethod, note } = req.body;

    if (!customerId) return res.status(400).json({ error: 'Customer ID is required' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'Order must have at least one item' });
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(', ')}` });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Fetch menu items & calculate total
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, available: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'One or more items are unavailable or not found' });
    }

    let total = 0;
    const orderItemsData = items.map((i) => {
      const menuItem = menuItems.find((m) => m.id === i.menuItemId);
      const lineTotal = menuItem.price * i.quantity;
      total += lineTotal;
      return {
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        price: menuItem.price,
      };
    });

    const order = await prisma.order.create({
      data: {
        customerId,
        paymentMethod,
        total: Math.round(total * 100) / 100,
        note: note || null,
        status: 'placed',
        paymentStatus: 'pending',
        items: { create: orderItemsData },
      },
      include: {
        items: { include: { menuItem: true } },
        customer: true,
      },
    });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id — get order by ID
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        items: {
          include: { menuItem: { include: { category: true } } },
        },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/customer/:phone — get orders by customer phone
const getCustomerOrders = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: { include: { menuItem: true } },
          },
        },
      },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ orders: customer.orders });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeOrder, getOrder, getCustomerOrders };
