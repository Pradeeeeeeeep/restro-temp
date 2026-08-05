const prisma = require('../prismaClient');

// POST /api/customer — register or find by phone
const upsertCustomer = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    const trimmedPhone = phone.trim();
    const trimmedName = name.trim();

    let customer = await prisma.customer.findUnique({ where: { phone: trimmedPhone } });
    if (customer) {
      // Update name if different
      if (customer.name !== trimmedName) {
        customer = await prisma.customer.update({
          where: { phone: trimmedPhone },
          data: { name: trimmedName },
        });
      }
    } else {
      customer = await prisma.customer.create({
        data: { name: trimmedName, phone: trimmedPhone },
      });
    }

    res.json({ customer });
  } catch (err) {
    next(err);
  }
};

module.exports = { upsertCustomer };
