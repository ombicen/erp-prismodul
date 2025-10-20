# Supabase Setup Guide

This guide will help you set up PostgreSQL with Supabase for this ERP Price Module project.

## Prerequisites

You need one of the following:
1. **Local PostgreSQL** (Easiest if already installed)
2. **Supabase CLI + Docker** (Full Supabase features)
3. **Cloud Supabase Account** (No local setup needed)

## Option 1: Local PostgreSQL (Recommended - Already Installed)

This option uses your existing PostgreSQL installation without Docker or Supabase CLI.

### Quick Setup

Simply run the setup script:

**Using PowerShell (Recommended):**
```powershell
.\setup-database.ps1
```

**Using Command Prompt:**
```cmd
setup-database.bat
```

This will:
1. Create a database named `erpprismodul`
2. Apply the schema migration (create all 9 tables)
3. Load seed data with realistic mockup data

### Manual Setup

If you prefer to run commands manually:

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE erpprismodul;"

# 2. Apply schema migration
psql -U postgres -d erpprismodul -f supabase/migrations/20251019164214_create_price_module_schema.sql

# 3. Load seed data
psql -U postgres -d erpprismodul -f supabase/seed.sql
```

### Update Environment Variables

Since you're using local PostgreSQL directly (not Supabase), you'll need to configure your app differently:

1. Update `.env` file:
```env
# Local PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=05758af4a9a545f48e98110461eb7073
DB_NAME=erpprismodul

# For Supabase client (optional - only if using Supabase features)
# You can use Supabase local or skip this if you're using direct PostgreSQL
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Verify the Setup

Connect to your database to verify:
```bash
psql -U postgres -d erpprismodul -c "\dt"
```

You should see 9 tables:
- departments
- product_groups
- suppliers
- products
- product_suppliers
- contracts
- customer_price_groups
- campaigns
- pricing_rules

Check the data:
```bash
psql -U postgres -d erpprismodul -c "SELECT COUNT(*) FROM products;"
```

### Sample Data Summary

The seed data includes:
- **5 Departments**: Electronics, Clothing, Home & Garden, Sports, Food & Beverages
- **13 Product Groups**: Laptops, Smartphones, Men's Wear, Women's Wear, Furniture, etc.
- **7 Suppliers**: Various wholesale suppliers
- **30 Products**: Realistic products with pricing
- **35 Product-Supplier Relationships**: Multiple suppliers per product
- **6 Contracts**: Active and planned contracts
- **5 Customer Price Groups**: VIP, Corporate, Retail, Wholesale, New Customer
- **6 Campaigns**: Seasonal and promotional campaigns
- **24 Pricing Rules**: Various discount rules (percentage, fixed, tiered)

## Option 2: Local Development with Supabase CLI

### Step 1: Install Prerequisites

#### Install Docker Desktop for Windows
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify installation: `docker --version`

#### Install Supabase CLI

Using Scoop (recommended for Windows):
```powershell
# Install Scoop if not already installed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Or download directly from: https://github.com/supabase/cli/releases

### Step 2: Initialize and Start Supabase

```bash
# Initialize Supabase (already done - config exists)
# supabase init

# Start Supabase locally (this will start PostgreSQL in Docker)
supabase start
```

This will:
- Start PostgreSQL on port 54322
- Start Supabase Studio on http://127.0.0.1:54323
- Start API server on http://127.0.0.1:54321
- Display your API keys

### Step 3: Update .env File

After running `supabase start`, you'll see output like:
```
API URL: http://127.0.0.1:54321
anon key: eyJhbGc...
service_role key: eyJhbGc...
```

Update your `.env` file with the `anon key`:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
```

### Step 4: Apply Database Migration

The migration file already exists at `supabase/migrations/20251019164214_create_price_module_schema.sql`

Apply it:
```bash
supabase db push
```

Or if you need to reset and apply all migrations:
```bash
supabase db reset
```

### Step 5: Access Supabase Studio

Open http://127.0.0.1:54323 in your browser to:
- View your database tables
- Run SQL queries
- Manage data visually

## Option 3: Cloud Supabase (No Docker Required)

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `erpprismodul`
   - Database password: `05758af4a9a545f48e98110461eb7073` (or choose your own)
   - Region: Choose closest to you
5. Click "Create new project"

### Step 2: Get Your API Keys

1. In your project dashboard, go to Settings > API
2. Copy the `URL` and `anon/public` key

### Step 3: Update .env File

Update your `.env` file:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
```

### Step 4: Apply Database Migration

1. In Supabase Dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the contents of `supabase/migrations/20251019164214_create_price_module_schema.sql`
4. Paste and run the SQL

Or use Supabase CLI:
```bash
# Link your local project to cloud
supabase link --project-ref your-project-ref

# Push migration
supabase db push
```

## Database Schema

The migration creates the following tables:
- `departments` - Product departments
- `product_groups` - Product groupings within departments
- `suppliers` - Supplier information
- `products` - Product catalog with pricing
- `product_suppliers` - Product-supplier relationships with costs
- `contracts` - Customer contracts
- `customer_price_groups` - Customer pricing tiers
- `campaigns` - Marketing campaigns
- `pricing_rules` - Flexible pricing rules for discounts

All tables have:
- Row Level Security (RLS) enabled
- Policies for authenticated users to read/write data
- Proper foreign key relationships
- Timestamps for auditing

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Verifying the Setup

1. Start your dev server: `npm run dev`
2. Open your browser to the app
3. Check browser console - there should be no Supabase connection errors
4. You can test the connection by importing the supabase client:
   ```typescript
   import { supabase } from './lib/supabase';

   // Test query
   const { data, error } = await supabase.from('departments').select('*');
   console.log({ data, error });
   ```

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env` file exists and has correct values
- Restart your dev server after updating `.env`

### Cannot connect to database
- For local: Make sure Docker is running and `supabase start` was successful
- For cloud: Verify your project URL and API keys are correct

### Migration errors
- Check PostgreSQL logs: `supabase status`
- View logs: `supabase logs`
- Reset database: `supabase db reset` (⚠️ this will delete all data)

## Useful Commands

```bash
# Check status of local Supabase
supabase status

# Stop local Supabase
supabase stop

# View database logs
supabase logs

# Open Supabase Studio
supabase studio

# Generate TypeScript types from database
supabase gen types typescript --local > src/types/database.ts

# Create a new migration
supabase migration new migration_name
```

## Next Steps

After setup is complete:
1. Start adding seed data through Supabase Studio
2. Build your UI components to interact with the database
3. Implement authentication if needed
4. Set up proper RLS policies for your use case

## Security Notes

- The `.env` file is gitignored to protect your credentials
- Never commit API keys or passwords to version control
- Use `service_role` key only on the backend (it bypasses RLS)
- Use `anon` key on the frontend (respects RLS policies)
