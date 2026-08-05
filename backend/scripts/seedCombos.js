const prisma = require('../prismaClient');

const SAMPLE_COMBOS = [
  {
    name: 'Crispy Burger Saver Combo',
    description: 'Double Cheeseburger + Large Golden Fries + Chilled Coke Float',
    originalPrice: 309,
    comboPrice: 249,
    savings: 60,
    badge: 'BESTSELLER ⚡',
    available: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cheesy Pizza Party Combo',
    description: 'Medium Loaded Farmhouse Pizza + Stuffed Garlic Bread + Choco Lava Cake',
    originalPrice: 509,
    comboPrice: 399,
    savings: 110,
    badge: 'POPULAR COMBO 🔥',
    available: true,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Family Crispy Bucket Combo',
    description: '8pc Spicy Crispy Chicken/Paneer Wings + 2 Dips + 2 Chilled Iced Teas',
    originalPrice: 619,
    comboPrice: 499,
    savings: 120,
    badge: 'MEGA SAVER 🎉',
    available: true,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80',
  }
];

async function seedCombos() {
  console.log('🌱 Seeding database combos...');
  for (const combo of SAMPLE_COMBOS) {
    const existing = await prisma.combo.findFirst({ where: { name: combo.name } });
    if (!existing) {
      await prisma.combo.create({ data: combo });
      console.log(`✅ Created combo: ${combo.name}`);
    } else {
      console.log(`ℹ️ Combo already exists: ${combo.name}`);
    }
  }
  console.log('🎉 Combos seeding complete!');
  await prisma.$disconnect();
}

seedCombos().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
