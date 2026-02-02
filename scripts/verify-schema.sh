#!/bin/bash

# Database Schema Verification Script
# Verifies that the production database schema matches expectations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "=========================================="
echo "Database Schema Verification"
echo "=========================================="
echo ""

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Database:${NC}"
echo "  $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/')"
echo ""

# Check migration status
echo -e "${BLUE}🔍 Checking migration status...${NC}"
npx prisma migrate status
echo ""

# Pull current schema
echo -e "${BLUE}🔍 Pulling current schema from database...${NC}"
npx prisma db pull --force
echo -e "${GREEN}✅ Schema pulled${NC}"
echo ""

# Check for drift
echo -e "${BLUE}🔍 Checking for schema drift...${NC}"
if npx prisma migrate diff \
    --from-schema-datamodel prisma/schema.prisma \
    --to-schema-datasource prisma/schema.prisma \
    --exit-code; then
    echo -e "${GREEN}✅ No schema drift detected${NC}"
else
    echo -e "${YELLOW}⚠️  Schema drift detected${NC}"
    echo "Review the differences above."
fi
echo ""

# Verify key tables exist
echo -e "${BLUE}🔍 Verifying key tables...${NC}"

TABLES=(
    "User"
    "Company"
    "Asset"
    "AssetVersion"
    "AssetShare"
    "PlatformUsage"
    "AssetDownload"
    "Approval"
    "AuditLog"
    "Notification"
)

for table in "${TABLES[@]}"; do
    if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"$table\";" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅${NC} $table"
    else
        echo -e "  ${RED}❌${NC} $table (missing or inaccessible)"
    fi
done
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ Schema verification complete${NC}"
echo "=========================================="
echo ""
