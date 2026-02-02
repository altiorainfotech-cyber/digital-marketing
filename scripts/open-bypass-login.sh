#!/bin/bash

echo "🚨 Opening Emergency Bypass Login..."
echo ""
echo "Note: Enter your bypass credentials in the browser"
echo ""
echo "Opening browser..."

# Open the bypass login page
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:3000/auth/bypass
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:3000/auth/bypass
elif command -v start &> /dev/null; then
    # Windows
    start http://localhost:3000/auth/bypass
else
    echo "Please open this URL manually:"
    echo "http://localhost:3000/auth/bypass"
fi

echo ""
echo "✅ Bypass login page should open in your browser"
echo "⚠️  Remember: This is a temporary solution. Remove after fixing database connection."
