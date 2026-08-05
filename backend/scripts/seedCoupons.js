const prisma = require('../prismaClient');

async function seedCoupons() {
  console.log('⏳ Seeding default coupons...');

  const coupons = [
    {
      code: 'WELCOME50',
      discountType: 'fixed',
      discountValue: 50,
      minOrderAmount: 150,
      active: true,
    },
    {
      code: 'CAFE20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 200,
      maxDiscount: 80,
      active: true,
    },
    {
      code: 'FESTIVAL100',
      discountType: 'fixed',
      discountValue: 100,
      minOrderAmount: 350,
      active: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
    console.log(`✅ Coupon ${c.code} ready!`);
  }

  console.log('🎉 Coupons seeded successfully!');
}

seedCoupons()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });
