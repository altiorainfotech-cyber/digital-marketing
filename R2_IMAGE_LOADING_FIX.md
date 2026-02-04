# R2 Image Loading Fix Guide

## Current Status

✅ **R2 Configuration is Correct:**
- R2_PUBLIC_URL is set: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`
- CORS is configured with correct origins
- Public Development URL is enabled

✅ **Images ARE accessible:**
- Test URL works: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/cml6gsw3h0000i3oujuclbgo0/1770115058264-2.png`
- Returns 200 OK with image/png content-type

## Issues Found

### Issue 1: Storage URL Format Inconsistency

Some assets in the database have incorrect storage URLs:
- ❌ `r2://digitalmarketing/images/cml6j2gd3000804ie69dym61g` (404 - file not found)
- ❌ `r2://digitalmarketing/videos/cml6izdjp000204iekjjbzrc5` (404 - file not found)
- ✅ `r2://digitalmarketing/assets/cml6gsw3h0000i3oujuclbgo0/1770115058264-2.png` (200 - works!)

**Root Cause:** The upload process is storing files with different path formats.

### Issue 2: CORS Headers

CORS is configured but headers only appear when:
1. Request includes an `Origin` header
2. Origin matches one of the allowed origins
3. Request is made from a browser

**This is normal behavior** - CORS headers are only sent for cross-origin requests.

## Solutions

### Solution 1: Fix Storage URL Format (Recommended)

Update your upload handler to use consistent paths:

```typescript
// In lib/services/UploadHandler.ts or StorageService.ts
const key = `assets/${assetId}/${timestamp}-${filename}`;
// NOT: `images/${assetId}` or `videos/${assetId}`
```

### Solution 2: Fix Existing Assets

Run this script to check and fix asset URLs:

```bash
npx tsx scripts/fix-storage-urls-with-files.ts
```

### Solution 3: Update CORS in Cloudflare Dashboard

Your current CORS configuration has a trailing slash issue. Update it:

**In Cloudflare Dashboard → R2 → digitalmarketing → CORS Policy:**

**Allowed Origins** (remove trailing slash):
```
http://localhost:3000
http://localhost:3001
https://digital-marketing-ten-alpha.vercel.app
```

**Allowed Methods:**
```
GET
PUT
POST
DELETE
HEAD
```

**Allowed Headers:**
```
*
```

**Exposed Headers:**
```
ETag
Content-Length
Content-Type
```

### Solution 4: Test in Browser

CORS only matters for browser requests. Test by:

1. Open your deployed app: https://digital-marketing-ten-alpha.vercel.app
2. Open browser DevTools (F12)
3. Go to Network tab
4. Try to view an image
5. Check the response headers - you should see `access-control-allow-origin`

## Verification Steps

### 1. Check if images are actually in R2:

```bash
npx tsx scripts/list-r2-files.ts
```

### 2. Test image access:

```bash
npx tsx scripts/test-actual-image.ts
```

### 3. Check asset URLs in database:

```bash
npx tsx scripts/check-asset-urls.ts
```

## Quick Fix for Immediate Testing

If you want to test right now:

1. Upload a new image through your app
2. Check the database for its storage URL
3. Convert it to public URL:
   - Take: `r2://digitalmarketing/assets/[id]/[filename]`
   - Convert to: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/[id]/[filename]`
4. Open that URL in your browser

## Expected Behavior

When working correctly:
- ✅ Images load in the browser
- ✅ No CORS errors in console
- ✅ Network tab shows 200 OK responses
- ✅ `access-control-allow-origin` header present in browser requests

## Common Mistakes

1. **Testing CORS with curl/Postman** - CORS headers only appear for browser requests with Origin header
2. **Trailing slashes in origins** - `https://example.com/` ≠ `https://example.com`
3. **Wrong storage path format** - Files must exist at the exact path specified in the database

## Next Steps

1. ✅ Your R2 configuration is correct
2. ⚠️ Fix the storage URL format in your upload code
3. ⚠️ Fix existing assets with incorrect URLs
4. ✅ Test in the actual browser (not curl)

The main issue is **storage URL format inconsistency**, not CORS configuration.
