/*
  Seed Data for Price Module Database

  This file contains realistic mockup data for all tables in the database.
  Run this with: psql -U postgres -d erpprismodul -f supabase/seed.sql
*/

-- Clear existing data (if any)
TRUNCATE TABLE pricing_rules, other_costs, product_suppliers, products, campaigns, customer_price_groups, contracts, product_groups, departments, suppliers CASCADE;

-- Insert Departments
INSERT INTO departments (id, name, code, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Electronics', 'ELEC', NOW() - INTERVAL '6 months'),
  ('22222222-2222-2222-2222-222222222222', 'Clothing & Apparel', 'CLOTH', NOW() - INTERVAL '5 months'),
  ('33333333-3333-3333-3333-333333333333', 'Home & Garden', 'HOME', NOW() - INTERVAL '4 months'),
  ('44444444-4444-4444-4444-444444444444', 'Sports & Outdoors', 'SPORT', NOW() - INTERVAL '3 months'),
  ('55555555-5555-5555-5555-555555555555', 'Food & Beverages', 'FOOD', NOW() - INTERVAL '2 months');

-- Insert Product Groups
INSERT INTO product_groups (id, name, code, department_id, created_at) VALUES
  -- Electronics
  ('a1111111-1111-1111-1111-111111111111', 'Laptops', 'ELEC-LAP', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '6 months'),
  ('a1111111-1111-1111-1111-111111111112', 'Smartphones', 'ELEC-PHN', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '6 months'),
  ('a1111111-1111-1111-1111-111111111113', 'Accessories', 'ELEC-ACC', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '5 months'),
  -- Clothing
  ('a2222222-2222-2222-2222-222222222221', 'Men''s Wear', 'CLOTH-MEN', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 months'),
  ('a2222222-2222-2222-2222-222222222222', 'Women''s Wear', 'CLOTH-WOM', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 months'),
  ('a2222222-2222-2222-2222-222222222223', 'Kids Wear', 'CLOTH-KID', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '4 months'),
  -- Home & Garden
  ('a3333333-3333-3333-3333-333333333331', 'Furniture', 'HOME-FUR', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '4 months'),
  ('a3333333-3333-3333-3333-333333333332', 'Kitchen Appliances', 'HOME-KITCH', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '4 months'),
  ('a3333333-3333-3333-3333-333333333333', 'Garden Tools', 'HOME-GARD', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 months'),
  -- Sports
  ('a4444444-4444-4444-4444-444444444441', 'Fitness Equipment', 'SPORT-FIT', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '3 months'),
  ('a4444444-4444-4444-4444-444444444442', 'Outdoor Gear', 'SPORT-OUT', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '3 months'),
  -- Food
  ('a5555555-5555-5555-5555-555555555551', 'Beverages', 'FOOD-BEV', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 months'),
  ('a5555555-5555-5555-5555-555555555552', 'Snacks', 'FOOD-SNK', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 months');

-- Insert Suppliers
INSERT INTO suppliers (id, name, code, created_at) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'TechSupply Global', 'TECH-GLB', NOW() - INTERVAL '1 year'),
  ('b2222222-2222-2222-2222-222222222222', 'Fashion Wholesale Inc', 'FASH-WHL', NOW() - INTERVAL '1 year'),
  ('b3333333-3333-3333-3333-333333333333', 'Home Depot Wholesale', 'HOME-DEP', NOW() - INTERVAL '10 months'),
  ('b4444444-4444-4444-4444-444444444444', 'Sports Direct Supply', 'SPRT-DIR', NOW() - INTERVAL '8 months'),
  ('b5555555-5555-5555-5555-555555555555', 'Food Distributors Ltd', 'FOOD-DST', NOW() - INTERVAL '6 months'),
  ('b6666666-6666-6666-6666-666666666666', 'Asian Electronics', 'ASIA-ELC', NOW() - INTERVAL '5 months'),
  ('b7777777-7777-7777-7777-777777777777', 'European Fashion', 'EUR-FASH', NOW() - INTERVAL '4 months');

-- Insert Products
INSERT INTO products (id, code, name, product_group_id, purchase_price, sync_status, last_sync, created_at) VALUES
  -- Laptops
  ('c1111111-1111-1111-1111-111111111111', 'LAP-001', 'Dell XPS 15', 'a1111111-1111-1111-1111-111111111111', 1299.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 months'),
  ('c1111111-1111-1111-1111-111111111112', 'LAP-002', 'MacBook Pro 16"', 'a1111111-1111-1111-1111-111111111111', 2499.99, 'synced', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 months'),
  ('c1111111-1111-1111-1111-111111111113', 'LAP-003', 'HP Pavilion 14', 'a1111111-1111-1111-1111-111111111111', 799.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 months'),
  ('c1111111-1111-1111-1111-111111111114', 'LAP-004', 'Lenovo ThinkPad X1', 'a1111111-1111-1111-1111-111111111111', 1599.99, 'pending', NULL, NOW() - INTERVAL '1 month'),

  -- Smartphones
  ('c1111111-1111-1111-1111-111111111121', 'PHN-001', 'iPhone 15 Pro', 'a1111111-1111-1111-1111-111111111112', 999.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 months'),
  ('c1111111-1111-1111-1111-111111111122', 'PHN-002', 'Samsung Galaxy S24', 'a1111111-1111-1111-1111-111111111112', 899.99, 'synced', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 months'),
  ('c1111111-1111-1111-1111-111111111123', 'PHN-003', 'Google Pixel 8', 'a1111111-1111-1111-1111-111111111112', 699.99, 'synced', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 month'),

  -- Accessories
  ('c1111111-1111-1111-1111-111111111131', 'ACC-001', 'Wireless Mouse', 'a1111111-1111-1111-1111-111111111113', 29.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 months'),
  ('c1111111-1111-1111-1111-111111111132', 'ACC-002', 'USB-C Hub', 'a1111111-1111-1111-1111-111111111113', 49.99, 'synced', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 months'),
  ('c1111111-1111-1111-1111-111111111133', 'ACC-003', 'Laptop Sleeve', 'a1111111-1111-1111-1111-111111111113', 24.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 month'),

  -- Men's Wear
  ('c2222222-2222-2222-2222-222222222221', 'MEN-001', 'Classic Suit', 'a2222222-2222-2222-2222-222222222221', 299.99, 'synced', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 months'),
  ('c2222222-2222-2222-2222-222222222222', 'MEN-002', 'Casual Shirt', 'a2222222-2222-2222-2222-222222222221', 49.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 months'),
  ('c2222222-2222-2222-2222-222222222223', 'MEN-003', 'Denim Jeans', 'a2222222-2222-2222-2222-222222222221', 79.99, 'synced', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 months'),

  -- Women's Wear
  ('c2222222-2222-2222-2222-222222222231', 'WOM-001', 'Evening Dress', 'a2222222-2222-2222-2222-222222222222', 199.99, 'synced', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 months'),
  ('c2222222-2222-2222-2222-222222222232', 'WOM-002', 'Blouse', 'a2222222-2222-2222-2222-222222222222', 59.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 months'),
  ('c2222222-2222-2222-2222-222222222233', 'WOM-003', 'Summer Skirt', 'a2222222-2222-2222-2222-222222222222', 44.99, 'synced', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 month'),

  -- Furniture
  ('c3333333-3333-3333-3333-333333333331', 'FUR-001', 'Office Desk', 'a3333333-3333-3333-3333-333333333331', 399.99, 'synced', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 months'),
  ('c3333333-3333-3333-3333-333333333332', 'FUR-002', 'Ergonomic Chair', 'a3333333-3333-3333-3333-333333333331', 299.99, 'synced', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 months'),
  ('c3333333-3333-3333-3333-333333333333', 'FUR-003', 'Bookshelf', 'a3333333-3333-3333-3333-333333333331', 149.99, 'synced', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 months'),

  -- Kitchen Appliances
  ('c3333333-3333-3333-3333-333333333341', 'KITCH-001', 'Coffee Maker', 'a3333333-3333-3333-3333-333333333332', 89.99, 'synced', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 months'),
  ('c3333333-3333-3333-3333-333333333342', 'KITCH-002', 'Blender', 'a3333333-3333-3333-3333-333333333332', 69.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 months'),
  ('c3333333-3333-3333-3333-333333333343', 'KITCH-003', 'Air Fryer', 'a3333333-3333-3333-3333-333333333332', 119.99, 'synced', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 month'),

  -- Fitness Equipment
  ('c4444444-4444-4444-4444-444444444441', 'FIT-001', 'Treadmill', 'a4444444-4444-4444-4444-444444444441', 899.99, 'synced', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 months'),
  ('c4444444-4444-4444-4444-444444444442', 'FIT-002', 'Dumbbells Set', 'a4444444-4444-4444-4444-444444444441', 149.99, 'synced', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 months'),
  ('c4444444-4444-4444-4444-444444444443', 'FIT-003', 'Yoga Mat', 'a4444444-4444-4444-4444-444444444441', 29.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 month'),

  -- Beverages
  ('c5555555-5555-5555-5555-555555555551', 'BEV-001', 'Premium Coffee Beans 1kg', 'a5555555-5555-5555-5555-555555555551', 24.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 months'),
  ('c5555555-5555-5555-5555-555555555552', 'BEV-002', 'Green Tea Pack', 'a5555555-5555-5555-5555-555555555551', 12.99, 'synced', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 months'),
  ('c5555555-5555-5555-5555-555555555553', 'BEV-003', 'Energy Drink 24-pack', 'a5555555-5555-5555-5555-555555555551', 34.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 month'),

  -- Snacks
  ('c5555555-5555-5555-5555-555555555561', 'SNK-001', 'Protein Bars Box', 'a5555555-5555-5555-5555-555555555552', 29.99, 'synced', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 months'),
  ('c5555555-5555-5555-5555-555555555562', 'SNK-002', 'Mixed Nuts 500g', 'a5555555-5555-5555-5555-555555555552', 19.99, 'synced', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 month'),
  ('c5555555-5555-5555-5555-555555555563', 'SNK-003', 'Organic Chips Pack', 'a5555555-5555-5555-5555-555555555552', 15.99, 'synced', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 month');

-- Insert Product Suppliers (multiple suppliers per product with discount info)
INSERT INTO product_suppliers (id, product_id, supplier_id, base_price, freight_cost, discount_type, discount_value, is_primary, created_at) VALUES
  -- Laptops
  ('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 1350.00, 25.00, '%', 5.00, true, NOW() - INTERVAL '3 months'),
  ('d1111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111111', 'b6666666-6666-6666-6666-666666666666', 1300.00, 35.00, 'KR', 50.00, false, NOW() - INTERVAL '2 months'),
  ('d1111111-1111-1111-1111-111111111121', 'c1111111-1111-1111-1111-111111111112', 'b1111111-1111-1111-1111-111111111111', 2550.00, 30.00, '%', 3.00, true, NOW() - INTERVAL '3 months'),
  ('d1111111-1111-1111-1111-111111111131', 'c1111111-1111-1111-1111-111111111113', 'b1111111-1111-1111-1111-111111111111', 820.00, 20.00, '%', 2.50, true, NOW() - INTERVAL '2 months'),
  ('d1111111-1111-1111-1111-111111111141', 'c1111111-1111-1111-1111-111111111114', 'b6666666-6666-6666-6666-666666666666', 1640.00, 28.00, '%', 4.00, true, NOW() - INTERVAL '1 month'),

  -- Smartphones
  ('d1111111-1111-1111-1111-111111111211', 'c1111111-1111-1111-1111-111111111121', 'b1111111-1111-1111-1111-111111111111', 1050.00, 15.00, '%', 6.00, true, NOW() - INTERVAL '2 months'),
  ('d1111111-1111-1111-1111-111111111212', 'c1111111-1111-1111-1111-111111111121', 'b6666666-6666-6666-6666-666666666666', 1020.00, 18.00, '%', 5.50, false, NOW() - INTERVAL '2 months'),
  ('d1111111-1111-1111-1111-111111111221', 'c1111111-1111-1111-1111-111111111122', 'b1111111-1111-1111-1111-111111111111', 940.00, 15.00, '%', 5.00, true, NOW() - INTERVAL '2 months'),
  ('d1111111-1111-1111-1111-111111111231', 'c1111111-1111-1111-1111-111111111123', 'b6666666-6666-6666-6666-666666666666', 720.00, 12.00, '%', 4.00, true, NOW() - INTERVAL '1 month'),

  -- Accessories
  ('d1111111-1111-1111-1111-111111111311', 'c1111111-1111-1111-1111-111111111131', 'b1111111-1111-1111-1111-111111111111', 32.00, 5.00, '%', 8.00, true, NOW() - INTERVAL '2 months'),
  ('d1111111-1111-1111-1111-111111111321', 'c1111111-1111-1111-1111-111111111132', 'b1111111-1111-1111-1111-111111111111', 52.00, 5.00, 'KR', 3.00, true, NOW() - INTERVAL '2 months'),
  ('d1111111-1111-1111-1111-111111111331', 'c1111111-1111-1111-1111-111111111133', 'b6666666-6666-6666-6666-666666666666', 27.00, 3.00, 'KR', 2.00, true, NOW() - INTERVAL '1 month'),

  -- Clothing
  ('d2222222-2222-2222-2222-222222222211', 'c2222222-2222-2222-2222-222222222221', 'b2222222-2222-2222-2222-222222222222', 310.00, 10.00, '%', 3.00, true, NOW() - INTERVAL '3 months'),
  ('d2222222-2222-2222-2222-222222222212', 'c2222222-2222-2222-2222-222222222221', 'b7777777-7777-7777-7777-777777777777', 330.00, 12.00, 'KR', 10.00, false, NOW() - INTERVAL '2 months'),
  ('d2222222-2222-2222-2222-222222222221', 'c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 52.00, 5.00, 'KR', 2.00, true, NOW() - INTERVAL '2 months'),
  ('d2222222-2222-2222-2222-222222222231', 'c2222222-2222-2222-2222-222222222223', 'b2222222-2222-2222-2222-222222222222', 84.00, 7.00, '%', 5.00, true, NOW() - INTERVAL '2 months'),
  ('d2222222-2222-2222-2222-222222222311', 'c2222222-2222-2222-2222-222222222231', 'b7777777-7777-7777-7777-777777777777', 210.00, 8.00, '%', 6.00, true, NOW() - INTERVAL '2 months'),
  ('d2222222-2222-2222-2222-222222222321', 'c2222222-2222-2222-2222-222222222232', 'b2222222-2222-2222-2222-222222222222', 62.00, 5.00, 'KR', 2.00, true, NOW() - INTERVAL '2 months'),
  ('d2222222-2222-2222-2222-222222222331', 'c2222222-2222-2222-2222-222222222233', 'b2222222-2222-2222-2222-222222222222', 47.00, 5.00, 'KR', 2.00, true, NOW() - INTERVAL '1 month'),

  -- Furniture
  ('d3333333-3333-3333-3333-333333333311', 'c3333333-3333-3333-3333-333333333331', 'b3333333-3333-3333-3333-333333333333', 420.00, 45.00, '%', 8.00, true, NOW() - INTERVAL '3 months'),
  ('d3333333-3333-3333-3333-333333333321', 'c3333333-3333-3333-3333-333333333332', 'b3333333-3333-3333-3333-333333333333', 315.00, 35.00, '%', 10.00, true, NOW() - INTERVAL '3 months'),
  ('d3333333-3333-3333-3333-333333333331', 'c3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 158.00, 20.00, '%', 12.00, true, NOW() - INTERVAL '2 months'),

  -- Kitchen Appliances
  ('d3333333-3333-3333-3333-333333333411', 'c3333333-3333-3333-3333-333333333341', 'b3333333-3333-3333-3333-333333333333', 94.00, 10.00, '%', 7.00, true, NOW() - INTERVAL '2 months'),
  ('d3333333-3333-3333-3333-333333333421', 'c3333333-3333-3333-3333-333333333342', 'b3333333-3333-3333-3333-333333333333', 74.00, 8.00, '%', 8.00, true, NOW() - INTERVAL '2 months'),
  ('d3333333-3333-3333-3333-333333333431', 'c3333333-3333-3333-3333-333333333343', 'b3333333-3333-3333-3333-333333333333', 126.00, 12.00, '%', 6.00, true, NOW() - INTERVAL '1 month'),

  -- Fitness
  ('d4444444-4444-4444-4444-444444444411', 'c4444444-4444-4444-4444-444444444441', 'b4444444-4444-4444-4444-444444444444', 950.00, 50.00, '%', 10.00, true, NOW() - INTERVAL '3 months'),
  ('d4444444-4444-4444-4444-444444444421', 'c4444444-4444-4444-4444-444444444442', 'b4444444-4444-4444-4444-444444444444', 158.00, 15.00, '%', 8.00, true, NOW() - INTERVAL '2 months'),
  ('d4444444-4444-4444-4444-444444444431', 'c4444444-4444-4444-4444-444444444443', 'b4444444-4444-4444-4444-444444444444', 32.00, 5.00, 'KR', 2.00, true, NOW() - INTERVAL '1 month'),

  -- Food & Beverages
  ('d5555555-5555-5555-5555-555555555511', 'c5555555-5555-5555-5555-555555555551', 'b5555555-5555-5555-5555-555555555555', 26.00, 8.00, '%', 5.00, true, NOW() - INTERVAL '2 months'),
  ('d5555555-5555-5555-5555-555555555521', 'c5555555-5555-5555-5555-555555555552', 'b5555555-5555-5555-5555-555555555555', 13.50, 5.00, 'KR', 0.50, true, NOW() - INTERVAL '2 months'),
  ('d5555555-5555-5555-5555-555555555531', 'c5555555-5555-5555-5555-555555555553', 'b5555555-5555-5555-5555-555555555555', 37.00, 10.00, '%', 6.00, true, NOW() - INTERVAL '1 month'),
  ('d5555555-5555-5555-5555-555555555611', 'c5555555-5555-5555-5555-555555555561', 'b5555555-5555-5555-5555-555555555555', 31.50, 6.00, '%', 5.00, true, NOW() - INTERVAL '2 months'),
  ('d5555555-5555-5555-5555-555555555621', 'c5555555-5555-5555-5555-555555555562', 'b5555555-5555-5555-5555-555555555555', 21.00, 5.00, 'KR', 1.00, true, NOW() - INTERVAL '1 month'),
  ('d5555555-5555-5555-5555-555555555631', 'c5555555-5555-5555-5555-555555555563', 'b5555555-5555-5555-5555-555555555555', 16.80, 4.00, '%', 3.00, true, NOW() - INTERVAL '1 month');

-- Insert Other Costs (global costs like KMCT, Tull, Förpackning)
INSERT INTO other_costs (id, name, cost_type, cost_value, is_active, created_at) VALUES
  ('z1111111-1111-1111-1111-111111111111', 'KMCT', '%', 3.00, true, NOW() - INTERVAL '6 months'),
  ('z2222222-2222-2222-2222-222222222222', 'Tull', 'KR', 5.00, true, NOW() - INTERVAL '6 months'),
  ('z3333333-3333-3333-3333-333333333333', 'Förpackning', 'KR', 2.50, true, NOW() - INTERVAL '4 months'),
  ('z4444444-4444-4444-4444-444444444444', 'Administrativa avgifter', '%', 1.50, true, NOW() - INTERVAL '3 months'),
  ('z5555555-5555-5555-5555-555555555555', 'Hantering', 'KR', 8.00, true, NOW() - INTERVAL '2 months');

-- Insert Contracts
INSERT INTO contracts (id, name, valid_from, valid_to, status, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Enterprise Tech Solutions 2024', '2024-01-01', '2024-12-31', 'active', NOW() - INTERVAL '6 months'),
  ('e2222222-2222-2222-2222-222222222222', 'Fashion Retailers Group', '2024-03-01', '2024-09-30', 'active', NOW() - INTERVAL '4 months'),
  ('e3333333-3333-3333-3333-333333333333', 'Office Furniture Bulk Deal', '2024-06-01', '2025-05-31', 'active', NOW() - INTERVAL '2 months'),
  ('e4444444-4444-4444-4444-444444444444', 'Gym Chain Partnership', '2024-05-01', '2024-11-30', 'active', NOW() - INTERVAL '3 months'),
  ('e5555555-5555-5555-5555-555555555555', 'Holiday Season 2024', '2024-11-01', '2025-01-15', 'planned', NOW() - INTERVAL '1 month'),
  ('e6666666-6666-6666-6666-666666666666', 'Q1 2024 Electronics', '2024-01-01', '2024-03-31', 'expired', NOW() - INTERVAL '8 months');

-- Insert Customer Price Groups
INSERT INTO customer_price_groups (id, name, valid_from, valid_to, description, status, created_at) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'VIP Customers', '2024-01-01', '2024-12-31', 'Premium customers with highest discount tier', 'active', NOW() - INTERVAL '6 months'),
  ('f2222222-2222-2222-2222-222222222222', 'Corporate Accounts', '2024-01-01', '2024-12-31', 'B2B corporate customers', 'active', NOW() - INTERVAL '6 months'),
  ('f3333333-3333-3333-3333-333333333333', 'Retail Partners', '2024-03-01', '2024-12-31', 'Retail resellers and partners', 'active', NOW() - INTERVAL '4 months'),
  ('f4444444-4444-4444-4444-444444444444', 'Wholesale Buyers', '2024-01-01', '2024-12-31', 'Volume buyers with bulk pricing', 'active', NOW() - INTERVAL '6 months'),
  ('f5555555-5555-5555-5555-555555555555', 'New Customer Promotion', '2024-08-01', '2024-10-31', 'Special pricing for new customers', 'active', NOW() - INTERVAL '1 month');

-- Insert Campaigns
INSERT INTO campaigns (id, name, valid_from, valid_to, status, created_at) VALUES
  ('g1111111-1111-1111-1111-111111111111', 'Back to School 2024', '2024-08-01', '2024-09-15', 'active', NOW() - INTERVAL '2 months'),
  ('g2222222-2222-2222-2222-222222222222', 'Summer Electronics Sale', '2024-06-01', '2024-08-31', 'active', NOW() - INTERVAL '3 months'),
  ('g3333333-3333-3333-3333-333333333333', 'Black Friday 2024', '2024-11-20', '2024-11-30', 'planned', NOW() - INTERVAL '1 month'),
  ('g4444444-4444-4444-4444-444444444444', 'Spring Fashion Week', '2024-04-01', '2024-04-30', 'expired', NOW() - INTERVAL '5 months'),
  ('g5555555-5555-5555-5555-555555555555', 'Fitness January', '2024-01-01', '2024-01-31', 'expired', NOW() - INTERVAL '8 months'),
  ('g6666666-6666-6666-6666-666666666666', 'Home Office Setup', '2024-07-01', '2024-09-30', 'active', NOW() - INTERVAL '2 months');

-- Insert Pricing Rules
INSERT INTO pricing_rules (id, context_type, context_id, target_type, target_id, discount_type, discount_value, quantity_threshold, excluded, created_at) VALUES
  -- Contract-based pricing rules
  ('h1111111-1111-1111-1111-111111111111', 'contract', 'e1111111-1111-1111-1111-111111111111', 'department', '11111111-1111-1111-1111-111111111111', 'percentage', 15.00, 0, false, NOW() - INTERVAL '6 months'),
  ('h1111111-1111-1111-1111-111111111112', 'contract', 'e1111111-1111-1111-1111-111111111111', 'product', 'c1111111-1111-1111-1111-111111111112', 'percentage', 20.00, 0, false, NOW() - INTERVAL '6 months'),
  ('h1111111-1111-1111-1111-111111111113', 'contract', 'e2222222-2222-2222-2222-222222222222', 'product_group', 'a2222222-2222-2222-2222-222222222221', 'percentage', 25.00, 0, false, NOW() - INTERVAL '4 months'),
  ('h1111111-1111-1111-1111-111111111114', 'contract', 'e3333333-3333-3333-3333-333333333333', 'product_group', 'a3333333-3333-3333-3333-333333333331', 'percentage', 18.00, 5, false, NOW() - INTERVAL '2 months'),
  ('h1111111-1111-1111-1111-111111111115', 'contract', 'e4444444-4444-4444-4444-444444444444', 'department', '44444444-4444-4444-4444-444444444444', 'percentage', 22.00, 10, false, NOW() - INTERVAL '3 months'),

  -- Customer Price Group rules
  ('h2222222-2222-2222-2222-222222222221', 'customer_price_group', 'f1111111-1111-1111-1111-111111111111', 'department', '11111111-1111-1111-1111-111111111111', 'percentage', 30.00, 0, false, NOW() - INTERVAL '6 months'),
  ('h2222222-2222-2222-2222-222222222222', 'customer_price_group', 'f1111111-1111-1111-1111-111111111111', 'department', '22222222-2222-2222-2222-222222222222', 'percentage', 28.00, 0, false, NOW() - INTERVAL '6 months'),
  ('h2222222-2222-2222-2222-222222222223', 'customer_price_group', 'f2222222-2222-2222-2222-222222222222', 'product_group', 'a1111111-1111-1111-1111-111111111111', 'percentage', 20.00, 0, false, NOW() - INTERVAL '6 months'),
  ('h2222222-2222-2222-2222-222222222224', 'customer_price_group', 'f3333333-3333-3333-3333-333333333333', 'department', '33333333-3333-3333-3333-333333333333', 'percentage', 15.00, 0, false, NOW() - INTERVAL '4 months'),
  ('h2222222-2222-2222-2222-222222222225', 'customer_price_group', 'f4444444-4444-4444-4444-444444444444', 'product_group', 'a5555555-5555-5555-5555-555555555551', 'percentage', 25.00, 50, false, NOW() - INTERVAL '6 months'),
  ('h2222222-2222-2222-2222-222222222226', 'customer_price_group', 'f5555555-5555-5555-5555-555555555555', 'department', '11111111-1111-1111-1111-111111111111', 'percentage', 10.00, 0, false, NOW() - INTERVAL '1 month'),

  -- Campaign-based pricing rules
  ('h3333333-3333-3333-3333-333333333331', 'campaign', 'g1111111-1111-1111-1111-111111111111', 'product_group', 'a1111111-1111-1111-1111-111111111111', 'percentage', 15.00, 0, false, NOW() - INTERVAL '2 months'),
  ('h3333333-3333-3333-3333-333333333332', 'campaign', 'g1111111-1111-1111-1111-111111111111', 'product_group', 'a3333333-3333-3333-3333-333333333331', 'percentage', 20.00, 0, false, NOW() - INTERVAL '2 months'),
  ('h3333333-3333-3333-3333-333333333333', 'campaign', 'g2222222-2222-2222-2222-222222222222', 'department', '11111111-1111-1111-1111-111111111111', 'percentage', 25.00, 0, false, NOW() - INTERVAL '3 months'),
  ('h3333333-3333-3333-3333-333333333334', 'campaign', 'g3333333-3333-3333-3333-333333333333', 'product', 'c1111111-1111-1111-1111-111111111121', 'fixed', 100.00, 0, false, NOW() - INTERVAL '1 month'),
  ('h3333333-3333-3333-3333-333333333335', 'campaign', 'g6666666-6666-6666-6666-666666666666', 'product_group', 'a3333333-3333-3333-3333-333333333331', 'percentage', 30.00, 0, false, NOW() - INTERVAL '2 months'),
  ('h3333333-3333-3333-3333-333333333336', 'campaign', 'g6666666-6666-6666-6666-666666666666', 'product_group', 'a3333333-3333-3333-3333-333333333332', 'percentage', 25.00, 0, false, NOW() - INTERVAL '2 months'),

  -- Tiered pricing (quantity-based)
  ('h4444444-4444-4444-4444-444444444441', 'customer_price_group', 'f4444444-4444-4444-4444-444444444444', 'product', 'c3333333-3333-3333-3333-333333333341', 'percentage', 10.00, 10, false, NOW() - INTERVAL '3 months'),
  ('h4444444-4444-4444-4444-444444444442', 'customer_price_group', 'f4444444-4444-4444-4444-444444444444', 'product', 'c3333333-3333-3333-3333-333333333341', 'percentage', 15.00, 25, false, NOW() - INTERVAL '3 months'),
  ('h4444444-4444-4444-4444-444444444443', 'customer_price_group', 'f4444444-4444-4444-4444-444444444444', 'product', 'c3333333-3333-3333-3333-333333333341', 'percentage', 20.00, 50, false, NOW() - INTERVAL '3 months'),

  -- Exclusions (products excluded from certain campaigns)
  ('h5555555-5555-5555-5555-555555555551', 'campaign', 'g3333333-3333-3333-3333-333333333333', 'product', 'c1111111-1111-1111-1111-111111111112', 'percentage', 0, 0, true, NOW() - INTERVAL '1 month'),
  ('h5555555-5555-5555-5555-555555555552', 'campaign', 'g2222222-2222-2222-2222-222222222222', 'product', 'c1111111-1111-1111-1111-111111111121', 'percentage', 0, 0, true, NOW() - INTERVAL '3 months');

-- Create a helpful view for easier data access
CREATE OR REPLACE VIEW products_with_details AS
SELECT
  p.id,
  p.code,
  p.name,
  p.purchase_price,
  p.sync_status,
  p.last_sync,
  pg.name as product_group_name,
  pg.code as product_group_code,
  d.name as department_name,
  d.code as department_code,
  ps.base_price,
  ps.freight_cost,
  ps.discount_type,
  ps.discount_value,
  s.name as primary_supplier_name
FROM products p
LEFT JOIN product_groups pg ON p.product_group_id = pg.id
LEFT JOIN departments d ON pg.department_id = d.id
LEFT JOIN product_suppliers ps ON p.id = ps.product_id AND ps.is_primary = true
LEFT JOIN suppliers s ON ps.supplier_id = s.id;

-- Summary statistics
SELECT 'Database seeded successfully!' as status;
SELECT COUNT(*) as departments_count FROM departments;
SELECT COUNT(*) as product_groups_count FROM product_groups;
SELECT COUNT(*) as suppliers_count FROM suppliers;
SELECT COUNT(*) as products_count FROM products;
SELECT COUNT(*) as product_suppliers_count FROM product_suppliers;
SELECT COUNT(*) as other_costs_count FROM other_costs;
SELECT COUNT(*) as contracts_count FROM contracts;
SELECT COUNT(*) as customer_price_groups_count FROM customer_price_groups;
SELECT COUNT(*) as campaigns_count FROM campaigns;
SELECT COUNT(*) as pricing_rules_count FROM pricing_rules;
