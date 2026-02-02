#!/bin/bash

# Production Database Migration Script
# This script safely applies Prisma migrations to production database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "DASCMS Production Database Migration"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Set it with:"
    echo "  export DATABASE_URL='postgresql://username:password@host.neon.tech/database?sslmode=require'"
    echo ""
    exit 1
fi

# Verify it's a production URL (basic check)
if [[ "$DATABASE_URL" == *"localhost"* ]]; then
    echo -e "${YELLOW}⚠️  Warning: DATABASE_URL contains 'localhost'${NC}"
    echo "Are you sure this is a production database?"
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Aborted."
        exit 1
    fi
fi

# Check if Prisma is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Current database:${NC}"
echo "  $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/')"  # Hide password
echo ""

# Step 1: Check migration status
echo -e "${BLUE}🔍 Checking migration status...${NC}"
if npx prisma migrate status; then
    echo -e "${GREEN}✅ Migration status checked${NC}"
else
    echo -e "${RED}❌ Failed to check migration status${NC}"
    exit 1
fi
echo ""

# Step 2: Confirm before proceeding
echo -e "${YELLOW}⚠️  This will apply migrations to the production database.${NC}"
read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi
echo ""

# Step 3: Create backup reminder
echo -e "${YELLOW}⚠️  Have you created a database backup?${NC}"
echo "Create one at: https://console.neon.tech"
read -p "Backup created? (yes/no): " backup_confirm
if [ "$backup_confirm" != "yes" ]; then
    echo "Please create a backup first, then run this script again."
    exit 1
fi
echo ""

# Step 4: Apply migrations
echo -e "${BLUE}📦 Applying migrations...${NC}"
if npx prisma migrate deploy; then
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo ""
    echo "To rollback, run:"
    echo "  npx prisma migrate resolve --rolled-back MIGRATION_NAME"
    exit 1
fi
echo ""

# Step 5: Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
if npx prisma generate; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi
echo ""

# Step 6: Verify schema
echo -e "${BLUE}🔍 Verifying schema...${NC}"
if npx prisma migrate status; then
    echo -e "${GREEN}✅ Schema verified${NC}"
else
    echo -e "${YELLOW}⚠️  Schema verification had warnings${NC}"
fi
echo ""

# Step 7: Test connection
echo -e "${BLUE}🔍 Testing database connection...${NC}"
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify database connection${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ Migration completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart your application (redeploy on Cloudflare Pages)"
echo "2. Monitor application logs for errors"
echo "3. Test critical workflows"
echo "4. Monitor database performance"
echo ""
echo "If issues occur, restore from backup:"
echo "  psql \$DATABASE_URL < backup.sql"
echo ""
