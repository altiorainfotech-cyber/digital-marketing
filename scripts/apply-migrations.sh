#!/bin/bash

# Script to apply Prisma migrations to the Neon database
# This script should be run after configuring the DATABASE_URL in .env

set -e

echo "🔍 Checking database connection..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

# Check if DATABASE_URL contains placeholder values
if [[ "$DATABASE_URL" == *"user:password@localhost"* ]]; then
    echo "❌ ERROR: DATABASE_URL appears to contain placeholder values"
    echo "Please update DATABASE_URL in your .env file with your actual Neon database connection string"
    echo ""
    echo "Example format:"
    echo "postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

echo "📊 Checking migration status..."
npx prisma migrate status

echo ""
echo "🚀 Applying migrations..."
npx prisma migrate deploy

echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Migrations applied successfully!"
echo ""
echo "Next steps:"
echo "1. Verify the database schema in your Neon dashboard"
echo "2. Run 'npm run dev' to start the development server"
