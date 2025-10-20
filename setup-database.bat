@echo off
REM PostgreSQL Database Setup Script
REM This script will create the database and apply migrations

echo ================================================
echo PostgreSQL Database Setup for ERP Price Module
echo ================================================
echo.

REM Configuration
set DB_NAME=erpprismodul
set DB_USER=postgres
set DB_PASSWORD=05758af4a9a545f48e98110461eb7073
set DB_HOST=localhost
set DB_PORT=5432

echo Step 1: Creating database...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -c "CREATE DATABASE %DB_NAME%;" 2>nul
if %errorlevel% neq 0 (
    echo Database might already exist or PostgreSQL is not running
    echo Continuing anyway...
)
echo.

echo Step 2: Applying schema migration...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f supabase\migrations\20251019164214_create_price_module_schema.sql
if %errorlevel% neq 0 (
    echo Error applying migration! Please check PostgreSQL is running.
    pause
    exit /b 1
)
echo.

echo Step 3: Loading seed data...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f supabase\seed.sql
if %errorlevel% neq 0 (
    echo Error loading seed data!
    pause
    exit /b 1
)
echo.

echo ================================================
echo Setup completed successfully!
echo ================================================
echo.
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo.
echo Next steps:
echo 1. Update your .env file with database credentials
echo 2. Run 'npm run dev' to start the application
echo.
pause
