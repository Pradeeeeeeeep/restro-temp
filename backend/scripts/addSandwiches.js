require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('⏳ Ensuring Snacks category exists...');
  let snacksCategory = await prisma.category.findUnique({ where: { name: 'Snacks' } });
  if (!snacksCategory) {
    snacksCategory = await prisma.category.create({ data: { name: 'Snacks', sortOrder: 3 } });
  }

  const sandwiches = [
    {
      name: 'Chicken Sandwich',
      description: 'Juicy shredded chicken breast with mayo, herbs & fresh veggies in toasted bread',
      price: 160,
      categoryId: snacksCategory.id,
      available: true,
      customizations: [
        { name: 'Extra Cheese', price: 20 },
        { name: 'Double Grilled', price: 10 },
        { name: 'Spiced Chicken', price: 30 }
      ]
    },
    {
      name: 'Egg Sandwich',
      description: 'Fluffy seasoned eggs with creamy mayo, pepper & crisp lettuce',
      price: 130,
      categoryId: snacksCategory.id,
      available: true,
      customizations: [
        { name: 'Extra Cheese', price: 20 },
        { name: 'Double Egg', price: 25 },
        { name: 'Brown Bread', price: 10 }
      ]
    },
    {
      name: 'Corn Sandwich',
      description: 'Sweet golden corn with melted cheese, bell peppers & Italian herbs',
      price: 120,
      categoryId: snacksCategory.id,
      available: true,
      customizations: [
        { name: 'Extra Cheese', price: 20 },
        { name: 'Extra Mayo', price: 15 },
        { name: 'Make it Spicy', price: 0 }
      ]
    },
    {
      name: 'Cheese Chilli Sandwich',
      description: 'Spicy green chillies loaded with gooey melted mozzarella & garlic butter toasted crust',
      price: 140,
      categoryId: snacksCategory.id,
      available: true,
      customizations: [
        { name: 'Extra Cheese', price: 25 },
        { name: 'Extra Spicy', price: 0 },
        { name: 'Garlic Crust', price: 15 }
      ]
    }
  ];

  for (const sw of sandwiches) {
    const existing = await prisma.menuItem.findFirst({ where: { name: sw.name } });
    if (existing) {
      await prisma.menuItem.update({ where: { id: existing.id }, data: sw });
      console.log(`✅ Updated ${sw.name}`);
    } else {
      await prisma.menuItem.create({ data: sw });
      console.log(`➕ Added ${sw.name}`);
    }
  }

  console.log('🎉 Sandwich items added successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
