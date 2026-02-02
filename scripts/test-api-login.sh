#!/bin/bash

EMAIL="${TEST_EMAIL:-}"
PASSWORD="${TEST_PASSWORD:-}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "Error: Email and password are required"
    echo ""
    echo "Usage:"
    echo "  TEST_EMAIL=your@email.com TEST_PASSWORD=yourpassword ./scripts/test-api-login.sh"
    exit 1
fi

echo "Testing login API..."
echo ""

# Test with provided credentials
echo "Attempting login with $EMAIL"
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"callbackUrl\":\"http://localhost:3000\"}" \
  -v 2>&1 | grep -E "(HTTP|Location|error)"

echo ""
echo "---"
echo ""

# Check session endpoint
echo "Checking session endpoint..."
curl -X GET http://localhost:3000/api/auth/session \
  -H "Content-Type: application/json" \
  2>&1 | head -20
