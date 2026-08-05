require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('🌱 Seeding database...');

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Coffee' },
      update: {},
      create: { name: 'Coffee', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { name: 'Cold Drinks' },
      update: {},
      create: { name: 'Cold Drinks', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: { name: 'Snacks', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { name: 'Desserts' },
      update: {},
      create: { name: 'Desserts', sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { name: 'Meals' },
      update: {},
      create: { name: 'Meals', sortOrder: 5 },
    }),
  ]);

  const [coffee, coldDrinks, snacks, desserts, meals] = categories;
  console.log('✅ Categories created');

  // Menu Items
  const menuItems = [
    // Coffee
    { name: 'Espresso', description: 'Rich, bold single shot of espresso', price: 80, categoryId: coffee.id, available: true },
    { name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 130, categoryId: coffee.id, available: true },
    { name: 'Latte', description: 'Smooth espresso with creamy steamed milk', price: 150, categoryId: coffee.id, available: true },
    { name: 'Cold Coffee', description: 'Chilled coffee blended with ice and milk', price: 160, categoryId: coffee.id, available: true },
    { name: 'Mocha', description: 'Espresso with chocolate and steamed milk', price: 170, categoryId: coffee.id, available: true },
    { name: 'Filter Coffee', description: 'Traditional South Indian filter coffee', price: 60, categoryId: coffee.id, available: true },

    // Cold Drinks
    { name: 'Lemonade', description: 'Freshly squeezed lemon with mint and soda', price: 90, categoryId: coldDrinks.id, available: true },
    { name: 'Mango Lassi', description: 'Thick and creamy mango yogurt drink', price: 120, categoryId: coldDrinks.id, available: true },
    { name: 'Cold Brew', description: '12-hour cold brewed coffee, smooth and strong', price: 180, categoryId: coldDrinks.id, available: true },
    { name: 'Iced Tea', description: 'Refreshing lemon iced tea', price: 80, categoryId: coldDrinks.id, available: true },

    // Snacks
    { name: 'Croissant', description: 'Buttery, flaky French croissant', price: 90, categoryId: snacks.id, available: true },
    { name: 'Veg Sandwich', description: 'Grilled sandwich with fresh veggies and cheese', price: 120, categoryId: snacks.id, available: true },
    { name: 'Samosa (2 pcs)', description: 'Crispy fried pastry with spiced potato filling', price: 60, categoryId: snacks.id, available: true },
    { name: 'Garlic Bread', description: 'Toasted bread with garlic butter and herbs', price: 100, categoryId: snacks.id, available: true },
    { name: 'French Fries', description: 'Crispy golden fries with dipping sauce', price: 110, categoryId: snacks.id, available: true },

    // Desserts
    { name: 'Chocolate Brownie', description: 'Warm fudgy brownie with vanilla ice cream', price: 150, categoryId: desserts.id, available: true },
    { name: 'Cheesecake', description: 'New York style baked cheesecake slice', price: 180, categoryId: desserts.id, available: true },
    { name: 'Gulab Jamun', description: 'Soft milk dumplings in rose syrup (3 pcs)', price: 80, categoryId: desserts.id, available: true },

    // Meals
    { name: 'Pasta Arrabbiata', description: 'Penne pasta in spicy tomato sauce', price: 220, categoryId: meals.id, available: true },
    { name: 'Paneer Wrap', description: 'Grilled paneer with veggies in a wheat wrap', price: 180, categoryId: meals.id, available: true },
    { name: 'Club Sandwich', description: 'Triple layer sandwich with cheese and salad', price: 200, categoryId: meals.id, available: true },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }

  console.log(`✅ ${menuItems.length} menu items created`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
