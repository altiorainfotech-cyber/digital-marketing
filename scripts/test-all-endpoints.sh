#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="${TEST_EMAIL:-}"
PASSWORD="${TEST_PASSWORD:-}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "Error: Email and password are required"
    echo ""
    echo "Usage:"
    echo "  TEST_EMAIL=your@email.com TEST_PASSWORD=yourpassword ./scripts/test-all-endpoints.sh"
    exit 1
fi

echo "================================"
echo "DASCMS Endpoint Testing"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if server is running
echo "1. Testing server availability..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓${NC} Server is running"
else
    echo -e "${RED}✗${NC} Server is not responding"
    exit 1
fi
echo ""

# Test 2: Test signin page
echo "2. Testing signin page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/signin")
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Signin page accessible (HTTP $STATUS)"
else
    echo -e "${RED}✗${NC} Signin page failed (HTTP $STATUS)"
fi
echo ""

# Test 3: Test NextAuth session endpoint
echo "3. Testing NextAuth session endpoint..."
SESSION=$(curl -s "$BASE_URL/api/auth/session")
echo "Response: $SESSION"
echo ""

# Test 4: Test CSRF token
echo "4. Getting CSRF token..."
CSRF_RESPONSE=$(curl -s "$BASE_URL/api/auth/csrf")
echo "CSRF Response: $CSRF_RESPONSE"
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: $CSRF_TOKEN"
echo ""

# Test 5: Test login with credentials
echo "5. Testing login with credentials..."
echo "Email: $EMAIL"
echo "Password: $PASSWORD"

# Create a cookie jar
COOKIE_JAR=$(mktemp)

# First, get the signin page to get cookies
curl -s -c "$COOKIE_JAR" "$BASE_URL/api/auth/signin" > /dev/null

# Get CSRF token
CSRF_TOKEN=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

# Attempt login
LOGIN_RESPONSE=$(curl -s -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF_TOKEN&email=$EMAIL&password=$PASSWORD&callbackUrl=$BASE_URL/dashboard&json=true")

echo "$LOGIN_RESPONSE" | head -20
echo ""

# Check if we got a session cookie
if grep -q "next-auth.session-token" "$COOKIE_JAR"; then
    echo -e "${GREEN}✓${NC} Session cookie received"
    
    # Test authenticated session
    echo ""
    echo "6. Testing authenticated session..."
    SESSION_DATA=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/session")
    echo "Session data: $SESSION_DATA"
    
    if echo "$SESSION_DATA" | grep -q "$EMAIL"; then
        echo -e "${GREEN}✓${NC} Login successful! User authenticated"
    else
        echo -e "${YELLOW}⚠${NC} Session exists but user data not found"
    fi
else
    echo -e "${RED}✗${NC} No session cookie received - login may have failed"
fi

# Cleanup
rm -f "$COOKIE_JAR"

echo ""
echo "================================"
echo "Testing API Endpoints"
echo "================================"
echo ""

# Test protected endpoints
echo "7. Testing protected API endpoints..."

# Get a fresh session
COOKIE_JAR=$(mktemp)
curl -s -c "$COOKIE_JAR" "$BASE_URL/api/auth/signin" > /dev/null
CSRF_TOKEN=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF_TOKEN&email=$EMAIL&password=$PASSWORD&callbackUrl=$BASE_URL" > /dev/null

# Test various endpoints
ENDPOINTS=(
  "GET /api/users"
  "GET /api/companies"
  "GET /api/assets"
  "GET /api/notifications"
  "GET /api/audit-logs"
)

for endpoint in "${ENDPOINTS[@]}"; do
  METHOD=$(echo $endpoint | cut -d' ' -f1)
  PATH=$(echo $endpoint | cut -d' ' -f2)
  
  echo -n "  $endpoint ... "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X $METHOD -b "$COOKIE_JAR" "$BASE_URL$PATH")
  
  if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} HTTP $STATUS"
  elif [ "$STATUS" = "401" ]; then
    echo -e "${RED}✗${NC} HTTP $STATUS (Unauthorized)"
  elif [ "$STATUS" = "403" ]; then
    echo -e "${YELLOW}⚠${NC} HTTP $STATUS (Forbidden)"
  else
    echo -e "${YELLOW}⚠${NC} HTTP $STATUS"
  fi
done

rm -f "$COOKIE_JAR"

echo ""
echo "================================"
echo "Test Complete"
echo "================================"
