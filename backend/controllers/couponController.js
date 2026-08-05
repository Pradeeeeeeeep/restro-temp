const prisma = require('../prismaClient');

// GET /api/coupons — list active coupons for customers
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { active: true },
      orderBy: { minOrderAmount: 'asc' },
    });
    res.json({ coupons });
  } catch (err) {
    next(err);
  }
};

// POST /api/coupons/validate — validate a coupon code against subtotal
const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || typeof subtotal !== 'number') {
      return res.status(400).json({ error: 'code and numerical subtotal are required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.active) {
      return res.status(400).json({ error: 'Invalid or inactive coupon code' });
    }

    if (subtotal < coupon.minOrderAmount) {
      const shortage = Math.ceil(coupon.minOrderAmount - subtotal);
      return res.status(400).json({
        error: `Min order ₹${coupon.minOrderAmount} required for coupon ${coupon.code}. Add ₹${shortage} more to apply!`,
        shortage,
        minOrderAmount: coupon.minOrderAmount,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      const calculated = (subtotal * coupon.discountValue) / 100;
      discount = coupon.maxDiscount ? Math.min(calculated, coupon.maxDiscount) : calculated;
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, subtotal);
    const discountAmount = Math.round(discount);
    const finalTotal = Math.max(0, Math.round(subtotal - discountAmount));

    res.json({
      valid: true,
      coupon,
      discountAmount,
      finalTotal,
      message: `Coupon ${coupon.code} applied! Saved ₹${discountAmount}`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCoupons, validateCoupon };
