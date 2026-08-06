const prisma = require('../prismaClient');

const VALID_PAYMENT_METHODS = ['cash', 'cafe', 'online'];
const VALID_STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'completed'];

// POST /api/orders — place a new order
const placeOrder = async (req, res, next) => {
  try {
    const { customerId, items, paymentMethod, note, couponCode, discount } = req.body;

    if (!customerId) return res.status(400).json({ error: 'Customer ID is required' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'Order must have at least one item' });
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(', ')}` });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Fetch menu items & calculate total
    const numericItemIds = items
      .filter((i) => typeof i.menuItemId === 'number' || (!isNaN(parseInt(i.menuItemId)) && !String(i.menuItemId).startsWith('combo-')))
      .map((i) => parseInt(i.menuItemId));

    const menuItems = numericItemIds.length > 0
      ? await prisma.menuItem.findMany({ where: { id: { in: numericItemIds } } })
      : [];

    let subtotal = 0;
    const orderItemsData = items.map((i) => {
      const isCombo = String(i.menuItemId).startsWith('combo-') || i.isCombo;
      let menuItemId = null;
      let name = i.name || 'Order Item';
      let itemPrice = parseFloat(i.price) || 0;

      if (!isCombo) {
        const idNum = parseInt(i.menuItemId);
        const menuItem = menuItems.find((m) => m.id === idNum);
        if (menuItem) {
          menuItemId = menuItem.id;
          name = menuItem.name;
          if (!itemPrice) itemPrice = menuItem.price;
        }
      }

      const lineTotal = itemPrice * i.quantity;
      subtotal += lineTotal;

      let custStr = null;
      if (i.customizations) {
        custStr = typeof i.customizations === 'string' ? i.customizations : JSON.stringify(i.customizations);
      }

      return {
        menuItemId,
        name,
        quantity: i.quantity,
        price: itemPrice,
        customizations: custStr,
      };
    });

    const discountVal = discount && !isNaN(discount) ? parseFloat(discount) : 0;
    const finalTotal = Math.max(0, subtotal - discountVal);

    const order = await prisma.order.create({
      data: {
        customerId,
        paymentMethod,
        total: Math.round(finalTotal * 100) / 100,
        discount: Math.round(discountVal * 100) / 100,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
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
