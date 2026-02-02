#!/bin/bash

# Pre-deployment verification script
# This script runs checks before deploying to production

set -e  # Exit on any error

echo "=========================================="
echo "DASCMS Pre-Deployment Checks"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the dascms directory.${NC}"
    exit 1
fi

echo "✅ Running from correct directory"
echo ""

# Check Node version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Error: Node.js version must be 20 or higher. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo ""

# Check if environment variables are set
echo "🔍 Checking environment variables..."
if [ -f ".env.production" ]; then
    echo "✅ .env.production file found"
    
    # Validate environment variables
    if command -v npx &> /dev/null; then
        echo "🔍 Validating environment variables..."
        if npx tsx scripts/validate-env.ts --production; then
            echo -e "${GREEN}✅ Environment variables are valid${NC}"
        else
            echo -e "${RED}❌ Environment variable validation failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Warning: npx not found, skipping environment validation${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Warning: .env.production file not found${NC}"
    echo "   Create it from .env.production.example before deploying"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if npm ci --quiet; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
if npm run db:generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi
echo ""

# Run linter
echo "🔍 Running linter..."
if npm run lint; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  Linting found issues (non-blocking)${NC}"
fi
echo ""

# Run tests
echo "🧪 Running tests..."
if npm test -- --run --reporter=verbose; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi
echo ""

# Build the application
echo "🏗️  Building application..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Check build output
if [ -d ".next" ]; then
    echo -e "${GREEN}✅ Build output directory exists${NC}"
    
    # Check build size
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "   Build size: $BUILD_SIZE"
else
    echo -e "${RED}❌ Build output directory not found${NC}"
    exit 1
fi
echo ""

# Summary
echo "=========================================="
echo "✅ All pre-deployment checks passed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review DEPLOYMENT.md for deployment instructions"
echo "2. Ensure all environment variables are set in Cloudflare Pages"
echo "3. Run database migrations: npm run db:migrate:deploy"
echo "4. Deploy to Cloudflare Pages"
echo ""
