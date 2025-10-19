/*
  # Price Module Database Schema

  ## Overview
  This migration creates the complete database structure for a comprehensive Price Module system
  with support for products, departments, product groups, contracts, customer price groups, 
  campaigns, suppliers, and contextual pricing rules.

  ## New Tables

  ### 1. departments
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Department name
  - `code` (text, unique) - Department code
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. product_groups
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Product group name
  - `code` (text, unique) - Product group code
  - `department_id` (uuid, foreign key) - Parent department
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. suppliers
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Supplier name
  - `code` (text, unique) - Supplier code
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. products
  - `id` (uuid, primary key) - Unique identifier
  - `code` (text, unique) - Product SKU/code
  - `name` (text) - Product name
  - `product_group_id` (uuid, foreign key) - Product group
  - `purchase_price` (numeric) - Base purchase price after supplier discounts
  - `sync_status` (text) - Visma sync status
  - `last_sync` (timestamptz) - Last sync timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### 5. product_suppliers
  - `id` (uuid, primary key) - Unique identifier
  - `product_id` (uuid, foreign key) - Product reference
  - `supplier_id` (uuid, foreign key) - Supplier reference
  - `supplier_price` (numeric) - Supplier's price
  - `freight_cost` (numeric) - Freight cost
  - `is_primary` (boolean) - Primary supplier flag
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. contracts
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Contract name
  - `valid_from` (date) - Validity start date
  - `valid_to` (date) - Validity end date
  - `status` (text) - Active/Planned/Expired
  - `created_at` (timestamptz) - Creation timestamp

  ### 7. customer_price_groups
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Price group name
  - `valid_from` (date) - Validity start date
  - `valid_to` (date) - Validity end date
  - `description` (text) - Description/comment
  - `status` (text) - Active/Planned/Expired
  - `created_at` (timestamptz) - Creation timestamp

  ### 8. campaigns
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Campaign name
  - `valid_from` (date) - Validity start date
  - `valid_to` (date) - Validity end date
  - `status` (text) - Active/Planned/Expired
  - `created_at` (timestamptz) - Creation timestamp

  ### 9. pricing_rules
  - `id` (uuid, primary key) - Unique identifier
  - `context_type` (text) - contract/customer_price_group/campaign
  - `context_id` (uuid) - Reference to context table
  - `target_type` (text) - product/product_group/department
  - `target_id` (uuid) - Reference to target
  - `discount_type` (text) - percentage/fixed/tiered
  - `discount_value` (numeric) - Discount amount or percentage
  - `quantity_threshold` (numeric) - Min quantity for tiered pricing
  - `excluded` (boolean) - Exclusion flag
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to read their own data

  ## Notes
  - All monetary values use numeric type for precision
  - Sync status tracks integration with Visma
  - Flexible pricing rules support multiple contexts and discount types
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create product_groups table
CREATE TABLE IF NOT EXISTS product_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  product_group_id uuid REFERENCES product_groups(id) ON DELETE SET NULL,
  purchase_price numeric(10,2) DEFAULT 0,
  sync_status text DEFAULT 'pending',
  last_sync timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create product_suppliers table
CREATE TABLE IF NOT EXISTS product_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_price numeric(10,2) DEFAULT 0,
  freight_cost numeric(10,2) DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  valid_from date,
  valid_to date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create customer_price_groups table
CREATE TABLE IF NOT EXISTS customer_price_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  valid_from date,
  valid_to date,
  description text DEFAULT '',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  valid_from date,
  valid_to date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type text NOT NULL,
  context_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  discount_type text DEFAULT 'percentage',
  discount_value numeric(10,2) DEFAULT 0,
  quantity_threshold numeric(10,2) DEFAULT 0,
  excluded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_price_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view product_groups"
  ON product_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view product_suppliers"
  ON product_suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view customer_price_groups"
  ON customer_price_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view pricing_rules"
  ON pricing_rules FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for authenticated users to modify data
CREATE POLICY "Users can insert departments"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update departments"
  ON departments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert product_groups"
  ON product_groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update product_groups"
  ON product_groups FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert customer_price_groups"
  ON customer_price_groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update customer_price_groups"
  ON customer_price_groups FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert pricing_rules"
  ON pricing_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update pricing_rules"
  ON pricing_rules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete pricing_rules"
  ON pricing_rules FOR DELETE
  TO authenticated
  USING (true);