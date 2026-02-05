#!/bin/bash

echo "🔍 Checking R2 Bucket Public Access..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Install it with:"
    echo "   npm install -g wrangler"
    exit 1
fi

echo "📦 Bucket: digitalmarketing"
echo "🌐 Expected Public URL: https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev"
echo ""

# Test the public URL
echo "Testing public URL..."
TEST_URL="https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/videos/cml96cni70000i6ouw6r79uhx"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL")

echo "HTTP Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Public access is working!"
    echo "   Video is accessible at: $TEST_URL"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Video file not found (404)"
    echo "   The video file doesn't exist in R2"
    echo ""
    echo "Solutions:"
    echo "1. Check if the file exists: npx wrangler r2 object list digitalmarketing --prefix videos/"
    echo "2. Re-upload the video through the app"
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ Access forbidden (403)"
    echo "   Public access is not enabled on the R2 bucket"
    echo ""
    echo "Solution:"
    echo "1. Go to Cloudflare Dashboard > R2 > digitalmarketing"
    echo "2. Settings > Public Access > Enable 'Allow Access'"
    echo "3. Or run: npx wrangler r2 bucket domain add digitalmarketing"
else
    echo "⚠️  Unexpected status code: $HTTP_CODE"
    echo ""
    echo "Common issues:"
    echo "- Bucket doesn't exist"
    echo "- Public URL is incorrect"
    echo "- Network issues"
fi

echo ""
echo "📋 Additional checks:"
echo ""

# Check CORS
echo "Checking CORS configuration..."
npx wrangler r2 bucket cors get digitalmarketing 2>&1 | head -20

echo ""
echo "To list all videos in R2:"
echo "  npx wrangler r2 object list digitalmarketing --prefix videos/"
