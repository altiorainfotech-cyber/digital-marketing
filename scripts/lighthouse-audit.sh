#!/bin/bash

# Lighthouse Audit Script
# Runs Lighthouse audits on all major pages and generates reports

set -e

echo "🔍 Running Lighthouse Audits for DASCMS"
echo "========================================"
echo ""

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo "❌ Lighthouse is not installed."
    echo "Install it globally with: npm install -g lighthouse"
    exit 1
fi

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
OUTPUT_DIR="lighthouse-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="${OUTPUT_DIR}/${TIMESTAMP}"

# Create output directory
mkdir -p "${REPORT_DIR}"

echo "📊 Base URL: ${BASE_URL}"
echo "📁 Reports will be saved to: ${REPORT_DIR}"
echo ""

# Pages to audit
declare -a PAGES=(
    "/:landing-page"
    "/auth/signin:sign-in"
    "/dashboard:dashboard"
    "/assets:asset-list"
    "/assets/upload:asset-upload"
    "/admin:admin-panel"
    "/analytics:analytics"
    "/notifications:notifications"
)

# Lighthouse configuration
LIGHTHOUSE_FLAGS=(
    "--output=html"
    "--output=json"
    "--chrome-flags=--headless"
    "--only-categories=performance,accessibility,best-practices,seo"
    "--throttling-method=simulate"
)

# Run audits
TOTAL=${#PAGES[@]}
CURRENT=0

for PAGE in "${PAGES[@]}"; do
    CURRENT=$((CURRENT + 1))
    
    # Split page path and name
    IFS=':' read -r PATH NAME <<< "$PAGE"
    URL="${BASE_URL}${PATH}"
    
    echo "[$CURRENT/$TOTAL] Auditing: $NAME"
    echo "URL: $URL"
    
    # Run lighthouse
    lighthouse "$URL" \
        "${LIGHTHOUSE_FLAGS[@]}" \
        --output-path="${REPORT_DIR}/${NAME}" \
        2>&1 | grep -E "(Performance|Accessibility|Best Practices|SEO|Lighthouse)" || true
    
    echo "✅ Completed: $NAME"
    echo ""
done

echo "========================================"
echo "✨ All audits completed!"
echo ""
echo "📊 Reports saved to: ${REPORT_DIR}"
echo ""
echo "To view reports:"
echo "  open ${REPORT_DIR}/*.html"
echo ""

# Generate summary
echo "Generating summary..."
node -e "
const fs = require('fs');
const path = require('path');

const reportDir = '${REPORT_DIR}';
const files = fs.readdirSync(reportDir).filter(f => f.endsWith('.json'));

console.log('\\n📈 Lighthouse Audit Summary\\n');
console.log('Page                    | Performance | Accessibility | Best Practices | SEO');
console.log('------------------------|-------------|---------------|----------------|-----');

files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(reportDir, file), 'utf8'));
    const categories = data.categories;
    const name = file.replace('.report.json', '').padEnd(23);
    const perf = Math.round(categories.performance.score * 100).toString().padStart(11);
    const a11y = Math.round(categories.accessibility.score * 100).toString().padStart(13);
    const bp = Math.round(categories['best-practices'].score * 100).toString().padStart(14);
    const seo = Math.round(categories.seo.score * 100).toString().padStart(3);
    
    console.log(\`\${name} | \${perf} | \${a11y} | \${bp} | \${seo}\`);
});

console.log('\\n✅ Summary complete\\n');
" 2>/dev/null || echo "⚠️  Could not generate summary (Node.js required)"

echo "Done! 🎉"
