# PostgreSQL Database Setup Script (PowerShell)
# This script will create the database and apply migrations

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database Setup for ERP Price Module" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DB_NAME = "erpprismodul"
$DB_USER = "postgres"
$DB_PASSWORD = "05758af4a9a545f48e98110461eb7073"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Set password environment variable for psql
$env:PGPASSWORD = $DB_PASSWORD

Write-Host "Step 1: Creating database..." -ForegroundColor Yellow
try {
    & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;" 2>$null
    Write-Host "Database created successfully!" -ForegroundColor Green
} catch {
    Write-Host "Database might already exist or PostgreSQL is not running. Continuing..." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 2: Applying schema migration..." -ForegroundColor Yellow
try {
    & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f "supabase\migrations\20251019164214_create_price_module_schema.sql"
    Write-Host "Schema migration applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error applying migration! Please check PostgreSQL is running." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

Write-Host "Step 3: Loading seed data..." -ForegroundColor Yellow
try {
    & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f "supabase\seed.sql"
    Write-Host "Seed data loaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error loading seed data!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: $DB_NAME" -ForegroundColor White
Write-Host "Host: $DB_HOST`:$DB_PORT" -ForegroundColor White
Write-Host "User: $DB_USER" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env file with database credentials" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the application" -ForegroundColor White
Write-Host ""

# Clear password
$env:PGPASSWORD = ""

Read-Host "Press Enter to exit"
