import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.productSurcharge.deleteMany();
  await prisma.surcharge.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.otherCost.deleteMany();
  await prisma.productSupplier.deleteMany();
  await prisma.contractProduct.deleteMany();
  await prisma.contractCustomer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.customerPriceGroup.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.productGroup.deleteMany();
  await prisma.department.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();

  // Insert Departments
  console.log('📁 Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({
      data: { id: '11111111-1111-1111-1111-111111111111', name: 'Electronics', code: 'ELEC' },
    }),
    prisma.department.create({
      data: { id: '22222222-2222-2222-2222-222222222222', name: 'Clothing & Apparel', code: 'CLOTH' },
    }),
    prisma.department.create({
      data: { id: '33333333-3333-3333-3333-333333333333', name: 'Home & Garden', code: 'HOME' },
    }),
    prisma.department.create({
      data: { id: '44444444-4444-4444-4444-444444444444', name: 'Sports & Outdoors', code: 'SPORT' },
    }),
    prisma.department.create({
      data: { id: '55555555-5555-5555-5555-555555555555', name: 'Food & Beverages', code: 'FOOD' },
    }),
  ]);

  // Insert Product Groups
  console.log('📦 Creating product groups...');
  await Promise.all([
    // Electronics
    prisma.productGroup.create({
      data: { id: 'a1111111-1111-1111-1111-111111111111', name: 'Laptops', code: 'ELEC-LAP', department_id: '11111111-1111-1111-1111-111111111111' },
    }),
    prisma.productGroup.create({
      data: { id: 'a1111111-1111-1111-1111-111111111112', name: 'Smartphones', code: 'ELEC-PHN', department_id: '11111111-1111-1111-1111-111111111111' },
    }),
    prisma.productGroup.create({
      data: { id: 'a1111111-1111-1111-1111-111111111113', name: 'Accessories', code: 'ELEC-ACC', department_id: '11111111-1111-1111-1111-111111111111' },
    }),
    // Clothing
    prisma.productGroup.create({
      data: { id: 'a2222222-2222-2222-2222-222222222221', name: "Men's Wear", code: 'CLOTH-MEN', department_id: '22222222-2222-2222-2222-222222222222' },
    }),
    prisma.productGroup.create({
      data: { id: 'a2222222-2222-2222-2222-222222222222', name: "Women's Wear", code: 'CLOTH-WOM', department_id: '22222222-2222-2222-2222-222222222222' },
    }),
    prisma.productGroup.create({
      data: { id: 'a2222222-2222-2222-2222-222222222223', name: 'Kids Wear', code: 'CLOTH-KID', department_id: '22222222-2222-2222-2222-222222222222' },
    }),
    // Home & Garden
    prisma.productGroup.create({
      data: { id: 'a3333333-3333-3333-3333-333333333331', name: 'Furniture', code: 'HOME-FUR', department_id: '33333333-3333-3333-3333-333333333333' },
    }),
    prisma.productGroup.create({
      data: { id: 'a3333333-3333-3333-3333-333333333332', name: 'Kitchen Appliances', code: 'HOME-KITCH', department_id: '33333333-3333-3333-3333-333333333333' },
    }),
    prisma.productGroup.create({
      data: { id: 'a3333333-3333-3333-3333-333333333333', name: 'Garden Tools', code: 'HOME-GARD', department_id: '33333333-3333-3333-3333-333333333333' },
    }),
    // Sports
    prisma.productGroup.create({
      data: { id: 'a4444444-4444-4444-4444-444444444441', name: 'Fitness Equipment', code: 'SPORT-FIT', department_id: '44444444-4444-4444-4444-444444444444' },
    }),
    prisma.productGroup.create({
      data: { id: 'a4444444-4444-4444-4444-444444444442', name: 'Outdoor Gear', code: 'SPORT-OUT', department_id: '44444444-4444-4444-4444-444444444444' },
    }),
    // Food
    prisma.productGroup.create({
      data: { id: 'a5555555-5555-5555-5555-555555555551', name: 'Beverages', code: 'FOOD-BEV', department_id: '55555555-5555-5555-5555-555555555555' },
    }),
    prisma.productGroup.create({
      data: { id: 'a5555555-5555-5555-5555-555555555552', name: 'Snacks', code: 'FOOD-SNK', department_id: '55555555-5555-5555-5555-555555555555' },
    }),
  ]);

  // Insert Suppliers
  console.log('🏭 Creating suppliers...');
  await Promise.all([
    prisma.supplier.create({
      data: { id: 'b1111111-1111-1111-1111-111111111111', name: 'TechSupply Global', code: 'TECH-GLB' },
    }),
    prisma.supplier.create({
      data: { id: 'b2222222-2222-2222-2222-222222222222', name: 'Fashion Wholesale Inc', code: 'FASH-WHL' },
    }),
    prisma.supplier.create({
      data: { id: 'b3333333-3333-3333-3333-333333333333', name: 'Home Depot Wholesale', code: 'HOME-DEP' },
    }),
    prisma.supplier.create({
      data: { id: 'b4444444-4444-4444-4444-444444444444', name: 'Sports Direct Supply', code: 'SPRT-DIR' },
    }),
    prisma.supplier.create({
      data: { id: 'b5555555-5555-5555-5555-555555555555', name: 'Food Distributors Ltd', code: 'FOOD-DST' },
    }),
    prisma.supplier.create({
      data: { id: 'b6666666-6666-6666-6666-666666666666', name: 'Asian Electronics', code: 'ASIA-ELC' },
    }),
    prisma.supplier.create({
      data: { id: 'b7777777-7777-7777-7777-777777777777', name: 'European Fashion', code: 'EUR-FASH' },
    }),
  ]);

  // Insert Products
  console.log('📱 Creating products...');
  const products = [
    // Laptops
    { id: 'c1111111-1111-1111-1111-111111111111', code: 'LAP-001', name: 'Dell XPS 15', product_group_id: 'a1111111-1111-1111-1111-111111111111', purchase_price: 1299.99, varumärke: 'Dell', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c1111111-1111-1111-1111-111111111112', code: 'LAP-002', name: 'MacBook Pro 16"', product_group_id: 'a1111111-1111-1111-1111-111111111111', purchase_price: 2499.99, varumärke: 'Apple', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c1111111-1111-1111-1111-111111111113', code: 'LAP-003', name: 'HP Pavilion 14', product_group_id: 'a1111111-1111-1111-1111-111111111111', purchase_price: 799.99, varumärke: 'HP', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c1111111-1111-1111-1111-111111111114', code: 'LAP-004', name: 'Lenovo ThinkPad X1', product_group_id: 'a1111111-1111-1111-1111-111111111111', purchase_price: 1599.99, varumärke: 'Lenovo', enhet: 'st', sync_status: 'pending', last_sync: null },

    // Smartphones
    { id: 'c1111111-1111-1111-1111-111111111121', code: 'PHN-001', name: 'iPhone 15 Pro', product_group_id: 'a1111111-1111-1111-1111-111111111112', purchase_price: 999.99, varumärke: 'Apple', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c1111111-1111-1111-1111-111111111122', code: 'PHN-002', name: 'Samsung Galaxy S24', product_group_id: 'a1111111-1111-1111-1111-111111111112', purchase_price: 899.99, varumärke: 'Samsung', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c1111111-1111-1111-1111-111111111123', code: 'PHN-003', name: 'Google Pixel 8', product_group_id: 'a1111111-1111-1111-1111-111111111112', purchase_price: 699.99, varumärke: 'Google', enhet: 'st', sync_status: 'synced', last_sync: new Date() },

    // Accessories
    { id: 'c1111111-1111-1111-1111-111111111131', code: 'ACC-001', name: 'Wireless Mouse', product_group_id: 'a1111111-1111-1111-1111-111111111113', purchase_price: 29.99, varumärke: 'Logitech', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c1111111-1111-1111-1111-111111111132', code: 'ACC-002', name: 'USB-C Hub', product_group_id: 'a1111111-1111-1111-1111-111111111113', purchase_price: 49.99, varumärke: 'Anker', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c1111111-1111-1111-1111-111111111133', code: 'ACC-003', name: 'Laptop Sleeve', product_group_id: 'a1111111-1111-1111-1111-111111111113', purchase_price: 24.99, varumärke: 'Generic', enhet: 'st', sync_status: 'synced', last_sync: new Date() },

    // Men's Wear
    { id: 'c2222222-2222-2222-2222-222222222221', code: 'MEN-001', name: 'Classic Suit', product_group_id: 'a2222222-2222-2222-2222-222222222221', purchase_price: 299.99, varumärke: 'Hugo Boss', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c2222222-2222-2222-2222-222222222222', code: 'MEN-002', name: 'Casual Shirt', product_group_id: 'a2222222-2222-2222-2222-222222222221', purchase_price: 49.99, varumärke: 'H&M', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c2222222-2222-2222-2222-222222222223', code: 'MEN-003', name: 'Denim Jeans', product_group_id: 'a2222222-2222-2222-2222-222222222221', purchase_price: 79.99, varumärke: "Levi's", enhet: 'st', sync_status: 'synced', last_sync: new Date() },

    // Women's Wear
    { id: 'c2222222-2222-2222-2222-222222222231', code: 'WOM-001', name: 'Evening Dress', product_group_id: 'a2222222-2222-2222-2222-222222222222', purchase_price: 199.99, varumärke: 'Zara', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c2222222-2222-2222-2222-222222222232', code: 'WOM-002', name: 'Blouse', product_group_id: 'a2222222-2222-2222-2222-222222222222', purchase_price: 59.99, varumärke: 'Mango', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c2222222-2222-2222-2222-222222222233', code: 'WOM-003', name: 'Summer Skirt', product_group_id: 'a2222222-2222-2222-2222-222222222222', purchase_price: 44.99, varumärke: 'H&M', enhet: 'st', sync_status: 'synced', last_sync: new Date() },

    // Furniture
    { id: 'c3333333-3333-3333-3333-333333333331', code: 'FUR-001', name: 'Office Desk', product_group_id: 'a3333333-3333-3333-3333-333333333331', purchase_price: 399.99, varumärke: 'IKEA', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c3333333-3333-3333-3333-333333333332', code: 'FUR-002', name: 'Ergonomic Chair', product_group_id: 'a3333333-3333-3333-3333-333333333331', purchase_price: 299.99, varumärke: 'Herman Miller', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c3333333-3333-3333-3333-333333333333', code: 'FUR-003', name: 'Bookshelf', product_group_id: 'a3333333-3333-3333-3333-333333333331', purchase_price: 149.99, varumärke: 'IKEA', enhet: 'st', sync_status: 'synced', last_sync: new Date() },

    // Kitchen Appliances
    { id: 'c3333333-3333-3333-3333-333333333341', code: 'KITCH-001', name: 'Coffee Maker', product_group_id: 'a3333333-3333-3333-3333-333333333332', purchase_price: 89.99, varumärke: 'De\'Longhi', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c3333333-3333-3333-3333-333333333342', code: 'KITCH-002', name: 'Blender', product_group_id: 'a3333333-3333-3333-3333-333333333332', purchase_price: 69.99, varumärke: 'Vitamix', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c3333333-3333-3333-3333-333333333343', code: 'KITCH-003', name: 'Air Fryer', product_group_id: 'a3333333-3333-3333-3333-333333333332', purchase_price: 119.99, varumärke: 'Philips', enhet: 'st', sync_status: 'synced', last_sync: new Date() },

    // Fitness Equipment
    { id: 'c4444444-4444-4444-4444-444444444441', code: 'FIT-001', name: 'Treadmill', product_group_id: 'a4444444-4444-4444-4444-444444444441', purchase_price: 899.99, varumärke: 'NordicTrack', enhet: 'st', sync_status: 'synced', last_sync: new Date() },
    { id: 'c4444444-4444-4444-4444-444444444442', code: 'FIT-002', name: 'Dumbbells Set', product_group_id: 'a4444444-4444-4444-4444-444444444441', purchase_price: 149.99, varumärke: 'Bowflex', enhet: 'set', sync_status: 'synced', last_sync: new Date() },
    { id: 'c4444444-4444-4444-4444-444444444443', code: 'FIT-003', name: 'Yoga Mat', product_group_id: 'a4444444-4444-4444-4444-444444444441', purchase_price: 29.99, varumärke: 'Manduka', enhet: 'st', sync_status: 'synced', last_sync: new Date() },

    // Beverages
    { id: 'c5555555-5555-5555-5555-555555555551', code: 'BEV-001', name: 'Premium Coffee Beans 1kg', product_group_id: 'a5555555-5555-5555-5555-555555555551', purchase_price: 24.99, varumärke: 'Lavazza', enhet: 'kg', sync_status: 'synced', last_sync: new Date() },
    { id: 'c5555555-5555-5555-5555-555555555552', code: 'BEV-002', name: 'Green Tea Pack', product_group_id: 'a5555555-5555-5555-5555-555555555551', purchase_price: 12.99, varumärke: 'Lipton', enhet: 'pack', sync_status: 'synced', last_sync: new Date() },
    { id: 'c5555555-5555-5555-5555-555555555553', code: 'BEV-003', name: 'Energy Drink 24-pack', product_group_id: 'a5555555-5555-5555-5555-555555555551', purchase_price: 34.99, varumärke: 'Red Bull', enhet: 'pack', sync_status: 'synced', last_sync: new Date() },

    // Snacks
    { id: 'c5555555-5555-5555-5555-555555555561', code: 'SNK-001', name: 'Protein Bars Box', product_group_id: 'a5555555-5555-5555-5555-555555555552', purchase_price: 29.99, varumärke: 'Quest', enhet: 'box', sync_status: 'synced', last_sync: new Date() },
    { id: 'c5555555-5555-5555-5555-555555555562', code: 'SNK-002', name: 'Mixed Nuts 500g', product_group_id: 'a5555555-5555-5555-5555-555555555552', purchase_price: 19.99, varumärke: 'Planters', enhet: 'pack', sync_status: 'synced', last_sync: new Date() },
    { id: 'c5555555-5555-5555-5555-555555555563', code: 'SNK-003', name: 'Organic Chips Pack', product_group_id: 'a5555555-5555-5555-5555-555555555552', purchase_price: 15.99, varumärke: 'Kettle', enhet: 'pack', sync_status: 'synced', last_sync: new Date() },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  // Insert Product Suppliers
  console.log('🔗 Creating product-supplier relationships...');
  const productSuppliers = [
    // Laptops
    { id: 'd1111111-1111-1111-1111-111111111111', product_id: 'c1111111-1111-1111-1111-111111111111', supplier_id: 'b1111111-1111-1111-1111-111111111111', base_price: 1350.00, discount_type: '%', discount_value: 5.00, is_primary: true },
    { id: 'd1111111-1111-1111-1111-111111111112', product_id: 'c1111111-1111-1111-1111-111111111111', supplier_id: 'b6666666-6666-6666-6666-666666666666', base_price: 1300.00, discount_type: 'KR', discount_value: 50.00, is_primary: false },
    { id: 'd1111111-1111-1111-1111-111111111121', product_id: 'c1111111-1111-1111-1111-111111111112', supplier_id: 'b1111111-1111-1111-1111-111111111111', base_price: 2550.00, discount_type: '%', discount_value: 3.00, is_primary: true },
    { id: 'd1111111-1111-1111-1111-111111111131', product_id: 'c1111111-1111-1111-1111-111111111113', supplier_id: 'b1111111-1111-1111-1111-111111111111', base_price: 820.00, discount_type: '%', discount_value: 2.50, is_primary: true },
    { id: 'd1111111-1111-1111-1111-111111111141', product_id: 'c1111111-1111-1111-1111-111111111114', supplier_id: 'b6666666-6666-6666-6666-666666666666', base_price: 1640.00, discount_type: '%', discount_value: 4.00, is_primary: true },

    // Smartphones
    { id: 'd1111111-1111-1111-1111-111111111211', product_id: 'c1111111-1111-1111-1111-111111111121', supplier_id: 'b1111111-1111-1111-1111-111111111111', base_price: 1050.00, discount_type: '%', discount_value: 6.00, is_primary: true },
    { id: 'd1111111-1111-1111-1111-111111111221', product_id: 'c1111111-1111-1111-1111-111111111122', supplier_id: 'b1111111-1111-1111-1111-111111111111', base_price: 940.00, discount_type: '%', discount_value: 5.00, is_primary: true },
    { id: 'd1111111-1111-1111-1111-111111111231', product_id: 'c1111111-1111-1111-1111-111111111123', supplier_id: 'b6666666-6666-6666-6666-666666666666', base_price: 720.00, discount_type: '%', discount_value: 4.00, is_primary: true },

    // Accessories
    { id: 'd1111111-1111-1111-1111-111111111311', product_id: 'c1111111-1111-1111-1111-111111111131', supplier_id: 'b1111111-1111-1111-1111-111111111111', base_price: 32.00, discount_type: '%', discount_value: 8.00, is_primary: true },
    { id: 'd1111111-1111-1111-1111-111111111321', product_id: 'c1111111-1111-1111-1111-111111111132', supplier_id: 'b1111111-1111-1111-1111-111111111111', base_price: 52.00, discount_type: 'KR', discount_value: 3.00, is_primary: true },
    { id: 'd1111111-1111-1111-1111-111111111331', product_id: 'c1111111-1111-1111-1111-111111111133', supplier_id: 'b6666666-6666-6666-6666-666666666666', base_price: 27.00, discount_type: 'KR', discount_value: 2.00, is_primary: true },

    // Continue with more suppliers...
    { id: 'd2222222-2222-2222-2222-222222222211', product_id: 'c2222222-2222-2222-2222-222222222221', supplier_id: 'b2222222-2222-2222-2222-222222222222', base_price: 310.00, discount_type: '%', discount_value: 3.00, is_primary: true },
    { id: 'd3333333-3333-3333-3333-333333333311', product_id: 'c3333333-3333-3333-3333-333333333331', supplier_id: 'b3333333-3333-3333-3333-333333333333', base_price: 420.00, discount_type: '%', discount_value: 8.00, is_primary: true },
    { id: 'd4444444-4444-4444-4444-444444444411', product_id: 'c4444444-4444-4444-4444-444444444441', supplier_id: 'b4444444-4444-4444-4444-444444444444', base_price: 950.00, discount_type: '%', discount_value: 10.00, is_primary: true },
    { id: 'd5555555-5555-5555-5555-555555555511', product_id: 'c5555555-5555-5555-5555-555555555551', supplier_id: 'b5555555-5555-5555-5555-555555555555', base_price: 26.00, discount_type: '%', discount_value: 5.00, is_primary: true },
  ];

  for (const ps of productSuppliers) {
    await prisma.productSupplier.create({ data: ps });
  }

  // Insert Other Costs
  console.log('💰 Creating other costs...');
  await Promise.all([
    prisma.otherCost.create({
      data: { id: 'z1111111-1111-1111-1111-111111111111', name: 'KMCT', cost_type: '%', cost_value: 3.00, is_active: true },
    }),
    prisma.otherCost.create({
      data: { id: 'z2222222-2222-2222-2222-222222222222', name: 'Tull', cost_type: 'KR', cost_value: 5.00, is_active: true },
    }),
    prisma.otherCost.create({
      data: { id: 'z3333333-3333-3333-3333-333333333333', name: 'Förpackning', cost_type: 'KR', cost_value: 2.50, is_active: true },
    }),
    prisma.otherCost.create({
      data: { id: 'z4444444-4444-4444-4444-444444444444', name: 'Administrativa avgifter', cost_type: '%', cost_value: 1.50, is_active: true },
    }),
    prisma.otherCost.create({
      data: { id: 'z5555555-5555-5555-5555-555555555555', name: 'Hantering', cost_type: 'KR', cost_value: 8.00, is_active: true },
    }),
  ]);

  // Insert Contracts
  console.log('📄 Creating contracts...');
  await Promise.all([
    prisma.contract.create({
      data: { id: 'e1111111-1111-1111-1111-111111111111', name: 'Enterprise Tech Solutions 2024', valid_from: new Date('2024-01-01'), valid_to: new Date('2024-12-31'), status: 'active' },
    }),
    prisma.contract.create({
      data: { id: 'e2222222-2222-2222-2222-222222222222', name: 'Fashion Retailers Group', valid_from: new Date('2024-03-01'), valid_to: new Date('2024-09-30'), status: 'active' },
    }),
  ]);

  // Insert Customer Price Groups
  console.log('👥 Creating customer price groups...');
  await Promise.all([
    prisma.customerPriceGroup.create({
      data: { id: 'f1111111-1111-1111-1111-111111111111', name: 'VIP Customers', valid_from: new Date('2024-01-01'), valid_to: new Date('2024-12-31'), description: 'Premium customers with highest discount tier', status: 'active' },
    }),
    prisma.customerPriceGroup.create({
      data: { id: 'f2222222-2222-2222-2222-222222222222', name: 'Corporate Accounts', valid_from: new Date('2024-01-01'), valid_to: new Date('2024-12-31'), description: 'B2B corporate customers', status: 'active' },
    }),
  ]);

  // Insert Campaigns
  console.log('📢 Creating campaigns...');
  await Promise.all([
    prisma.campaign.create({
      data: { id: 'g1111111-1111-1111-1111-111111111111', name: 'Back to School 2024', valid_from: new Date('2024-08-01'), valid_to: new Date('2024-09-15'), status: 'active' },
    }),
    prisma.campaign.create({
      data: { id: 'g2222222-2222-2222-2222-222222222222', name: 'Summer Electronics Sale', valid_from: new Date('2024-06-01'), valid_to: new Date('2024-08-31'), status: 'active' },
    }),
  ]);

  // Insert Surcharges
  console.log('💵 Creating surcharges...');
  await Promise.all([
    prisma.surcharge.create({
      data: {
        id: 'p1111111-1111-1111-1111-111111111111',
        name: 'Import Tax',
        description: 'Standard import tax for international goods',
        cost_type: '%',
        cost_value: 15.00,
        type: 'product',
        sort_order: 0,
        source: 'final_price',
        is_active: true,
      },
    }),
    prisma.surcharge.create({
      data: {
        id: 'p2222222-2222-2222-2222-222222222222',
        name: 'Express Shipping',
        description: 'Additional cost for express shipping',
        cost_type: 'KR',
        cost_value: 50.00,
        type: 'supplier',
        sort_order: 1,
        source: 'calculation_price',
        is_active: true,
      },
    }),
    prisma.surcharge.create({
      data: {
        id: 'p3333333-3333-3333-3333-333333333333',
        name: 'Quality Control Fee',
        description: 'Quality inspection fee for electronics',
        cost_type: '%',
        cost_value: 2.50,
        type: 'product',
        sort_order: 2,
        source: 'final_price',
        is_active: true,
      },
    }),
  ]);

  // Assign some products to surcharges
  console.log('🔗 Assigning products to surcharges...');
  await Promise.all([
    // Import Tax applies to laptops and smartphones
    prisma.productSurcharge.create({
      data: { surcharge_id: 'p1111111-1111-1111-1111-111111111111', product_id: 'c1111111-1111-1111-1111-111111111111' },
    }),
    prisma.productSurcharge.create({
      data: { surcharge_id: 'p1111111-1111-1111-1111-111111111111', product_id: 'c1111111-1111-1111-1111-111111111112' },
    }),
    prisma.productSurcharge.create({
      data: { surcharge_id: 'p1111111-1111-1111-1111-111111111111', product_id: 'c1111111-1111-1111-1111-111111111121' },
    }),
    // Express Shipping for furniture
    prisma.productSurcharge.create({
      data: { surcharge_id: 'p2222222-2222-2222-2222-222222222222', product_id: 'c3333333-3333-3333-3333-333333333331' },
    }),
    prisma.productSurcharge.create({
      data: { surcharge_id: 'p2222222-2222-2222-2222-222222222222', product_id: 'c3333333-3333-3333-3333-333333333332' },
    }),
    // Quality Control for all electronics
    prisma.productSurcharge.create({
      data: { surcharge_id: 'p3333333-3333-3333-3333-333333333333', product_id: 'c1111111-1111-1111-1111-111111111111' },
    }),
    prisma.productSurcharge.create({
      data: { surcharge_id: 'p3333333-3333-3333-3333-333333333333', product_id: 'c1111111-1111-1111-1111-111111111112' },
    }),
    prisma.productSurcharge.create({
      data: { surcharge_id: 'p3333333-3333-3333-3333-333333333333', product_id: 'c1111111-1111-1111-1111-111111111113' },
    }),
    prisma.productSurcharge.create({
      data: { surcharge_id: 'p3333333-3333-3333-3333-333333333333', product_id: 'c1111111-1111-1111-1111-111111111121' },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`  - ${departments.length} departments`);
  console.log(`  - ${products.length} products`);
  console.log(`  - 3 surcharge items`);
  console.log(`  - 9 surcharge-product assignments`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
