# Database Quick Reference

## Quick Start

Run the setup script to create and populate your database:

```powershell
.\setup-database.ps1
```

Or using Command Prompt:
```cmd
setup-database.bat
```

## Database Schema

### Tables Overview

1. **departments** - Product departments/categories
2. **product_groups** - Product groups within departments
3. **suppliers** - Supplier information
4. **products** - Product catalog
5. **product_suppliers** - Product-supplier relationships with pricing
6. **contracts** - Customer contracts
7. **customer_price_groups** - Customer pricing tiers
8. **campaigns** - Marketing campaigns
9. **pricing_rules** - Flexible pricing/discount rules

### Entity Relationships

```
departments
    └── product_groups
            └── products
                    └── product_suppliers ── suppliers

contracts ──┐
            ├── pricing_rules
campaigns ──┤
            └── (targets: products, product_groups, departments)
customer_price_groups ──┘
```

## Sample Data

### Products by Department
- **Electronics** (11 products): Laptops, Smartphones, Accessories
- **Clothing** (6 products): Men's, Women's, Kids wear
- **Home & Garden** (6 products): Furniture, Kitchen appliances
- **Sports** (3 products): Fitness equipment
- **Food & Beverages** (6 products): Coffee, tea, snacks

### Pricing Rules Examples

#### Contract-based
- Enterprise Tech Solutions: 15% off Electronics department
- Fashion Retailers Group: 25% off Men's wear

#### Customer Price Groups
- VIP Customers: 30% off Electronics, 28% off Clothing
- Corporate Accounts: 20% off Laptops
- Wholesale Buyers: 25% off Beverages (minimum 50 units)

#### Campaigns
- Back to School: 15% off Laptops, 20% off Furniture
- Summer Electronics Sale: 25% off Electronics department
- Black Friday: $100 fixed discount on iPhone 15 Pro

#### Tiered Pricing
- Coffee Maker (Wholesale):
  - 10+ units: 10% off
  - 25+ units: 15% off
  - 50+ units: 20% off

## Common Queries

### List all products with details
```sql
SELECT * FROM products_with_details;
```

### Get products in a specific department
```sql
SELECT p.*, pg.name as product_group, d.name as department
FROM products p
JOIN product_groups pg ON p.product_group_id = pg.id
JOIN departments d ON pg.department_id = d.id
WHERE d.code = 'ELEC';
```

### Find active pricing rules for a product
```sql
SELECT pr.*, c.name as context_name
FROM pricing_rules pr
LEFT JOIN contracts c ON pr.context_type = 'contract' AND pr.context_id = c.id
LEFT JOIN campaigns cam ON pr.context_type = 'campaign' AND pr.context_id = cam.id
WHERE pr.target_type = 'product'
  AND pr.target_id = 'p1111111-1111-1111-1111-111111111111'
  AND NOT pr.excluded;
```

### Get suppliers for a product
```sql
SELECT s.name, ps.supplier_price, ps.freight_cost, ps.is_primary
FROM product_suppliers ps
JOIN suppliers s ON ps.supplier_id = s.id
WHERE ps.product_id = 'p1111111-1111-1111-1111-111111111111'
ORDER BY ps.is_primary DESC, ps.supplier_price ASC;
```

### List active campaigns
```sql
SELECT * FROM campaigns
WHERE status = 'active'
  AND valid_from <= CURRENT_DATE
  AND (valid_to IS NULL OR valid_to >= CURRENT_DATE);
```

### Calculate price with discounts
```sql
-- Example: Get product price with applicable discounts
SELECT
    p.name,
    p.purchase_price,
    pr.discount_type,
    pr.discount_value,
    CASE
        WHEN pr.discount_type = 'percentage' THEN
            p.purchase_price * (1 - pr.discount_value / 100)
        WHEN pr.discount_type = 'fixed' THEN
            p.purchase_price - pr.discount_value
        ELSE p.purchase_price
    END as final_price
FROM products p
LEFT JOIN pricing_rules pr ON pr.target_id = p.id AND pr.target_type = 'product'
WHERE p.code = 'LAP-001';
```

## Database Maintenance

### Reset database
```bash
psql -U postgres -d erpprismodul -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -U postgres -d erpprismodul -f supabase/migrations/20251019164214_create_price_module_schema.sql
psql -U postgres -d erpprismodul -f supabase/seed.sql
```

### Backup database
```bash
pg_dump -U postgres erpprismodul > backup_$(date +%Y%m%d).sql
```

### Restore database
```bash
psql -U postgres -d erpprismodul < backup_20241019.sql
```

### Connect to database
```bash
psql -U postgres -d erpprismodul
```

## Connection Details

- **Database**: erpprismodul
- **Host**: localhost
- **Port**: 5432
- **User**: postgres
- **Password**: 05758af4a9a545f48e98110461eb7073

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Policies allow authenticated users to read/write data
- The `.env` file is gitignored - never commit credentials
- Change the default password in production

## Troubleshooting

### PostgreSQL service not running
```bash
# Windows - Start PostgreSQL service
net start postgresql-x64-XX
```

### Can't connect to database
Check PostgreSQL is running:
```bash
psql -U postgres -c "SELECT version();"
```

### Permission denied
Make sure you're using the correct username and password:
```bash
psql -U postgres -h localhost -p 5432
```

### Tables already exist
If you get "already exists" errors, drop and recreate:
```bash
psql -U postgres -d erpprismodul -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## Next Steps

1. Run the setup script: `.\setup-database.ps1`
2. Verify tables: `psql -U postgres -d erpprismodul -c "\dt"`
3. Check data: `psql -U postgres -d erpprismodul -c "SELECT COUNT(*) FROM products;"`
4. Start your app: `npm run dev`

For detailed setup instructions, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
