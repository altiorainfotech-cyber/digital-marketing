#!/bin/bash

# Auto-create admin user script
# Usage: ADMIN_NAME="Admin" ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpassword ./scripts/create-admin-auto.sh

if [ -z "$ADMIN_NAME" ] || [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "Error: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables are required"
    echo ""
    echo "Usage:"
    echo '  ADMIN_NAME="Admin" ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpassword ./scripts/create-admin-auto.sh'
    exit 1
fi

echo "$ADMIN_NAME" | \
echo "$ADMIN_EMAIL" | \
echo "$ADMIN_PASSWORD" | \
echo "$ADMIN_PASSWORD" | \
npx tsx scripts/create-admin-user.ts
