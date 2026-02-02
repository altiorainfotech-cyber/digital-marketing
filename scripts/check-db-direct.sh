#!/bin/bash

# Load DATABASE_URL from .env
export $(cat .env | grep DATABASE_URL | xargs)

echo "Checking database connection..."
echo ""

# Extract connection details
DB_URL="$DATABASE_URL"

echo "Attempting to query users table..."
echo ""

# Use psql to query
psql "$DB_URL" -c "SELECT email, name, role, LEFT(password, 20) as password_start, LENGTH(password) as pwd_len, \"createdAt\" FROM \"User\" ORDER BY \"createdAt\";"
