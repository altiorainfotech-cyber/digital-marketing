# Asset Preview Troubleshooting Guide

## Issue: Asset Previews Not Showing

If you see fallback icons instead of actual images/videos in the download history, follow these steps:

---

## ✅ Solution Applied

### 1. Environment Variable Added
Added `NEXT_PUBLIC_R2_PUBLIC_URL` to `.env` file:
```env
NEXT_PUBLIC_R2_PUBLIC_URL="https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev"
```

**Why?** Environment variables need the `NEXT_PUBLIC_` prefix to be accessible in client-side React components.

### 2. URL Generation Fixed
Updated `getPublicUrl()` function to properly extract the key from R2 storage URLs:

**Storage URL Format:**
```
r2://digitalmarketing/assets/abc123/image.jpg
```

**Extraction Logic:**
```typescript
// Extract key from: r2://bucket-name/path/to/file.ext
const match = storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
// Result: "assets/abc123/image.jpg"
```

**Generated Public URL:**
```
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/abc123/image.jpg
```

---

## 🔧 Steps to Fix (If Still Not Working)

### Step 1: Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

**Why?** Environment variables are loaded when the server starts. Changes to `.env` require a restart.

### Step 2: Clear Browser Cache
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

**Why?** Browser may have cached the fallback icons.

### Step 3: Check Browser Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for logs like:
   "Generated public URL: https://... from storage URL: r2://..."
```

**What to check:**
- Is the public URL being generated?
- Are there any CORS errors?
- Are there 404 errors for images?

### Step 4: Verify R2 Bucket Configuration

#### Check Public Access
1. Go to Cloudflare Dashboard
2. Navigate to R2 > Your Bucket
3. Go to Settings > Public Access
4. Ensure "Allow Public Access" is enabled

#### Check CORS Settings
Your bucket should have CORS configured:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 5: Test Direct URL Access
Copy a generated URL from console and paste it in a new browser tab:
```
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/abc123/image.jpg
```

**Expected:** Image should load
**If 404:** File doesn't exist in R2 bucket
**If 403:** Public access not enabled
**If CORS error:** CORS not configured

---

## 🔍 Debugging Checklist

### Environment Variables
- [ ] `.env` file has `NEXT_PUBLIC_R2_PUBLIC_URL`
- [ ] Value matches your R2 public domain
- [ ] No trailing slash in the URL
- [ ] Server restarted after adding variable

### R2 Bucket
- [ ] Public access enabled
- [ ] CORS configured correctly
- [ ] Files actually exist in bucket
- [ ] File paths match storage URLs

### Code
- [ ] `getPublicUrl()` function updated
- [ ] Console logs show correct URLs
- [ ] No TypeScript errors
- [ ] Component re-rendered after changes

### Browser
- [ ] Cache cleared
- [ ] No CORS errors in console
- [ ] No 404 errors in Network tab
- [ ] Images load when URL pasted directly

---

## 📊 How It Works

### Data Flow
```
Database storageUrl
    ↓
r2://digitalmarketing/assets/abc123/image.jpg
    ↓
Extract key using regex
    ↓
assets/abc123/image.jpg
    ↓
Combine with public URL
    ↓
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/abc123/image.jpg
    ↓
Display in <img> tag
```

### URL Formats Handled

| Storage URL | Extracted Key | Public URL |
|-------------|---------------|------------|
| `r2://bucket/assets/file.jpg` | `assets/file.jpg` | `https://pub-xxx.r2.dev/assets/file.jpg` |
| `r2://bucket/images/abc/img.png` | `images/abc/img.png` | `https://pub-xxx.r2.dev/images/abc/img.png` |
| `https://example.com/img.jpg` | (unchanged) | `https://example.com/img.jpg` |
| `assets/file.jpg` | `assets/file.jpg` | `https://pub-xxx.r2.dev/assets/file.jpg` |

---

## 🧪 Testing

### Test 1: Check Environment Variable
```bash
# In your terminal
echo $NEXT_PUBLIC_R2_PUBLIC_URL
```

**Expected:** Should print your R2 public URL

### Test 2: Check in Browser Console
```javascript
// In browser console
console.log(process.env.NEXT_PUBLIC_R2_PUBLIC_URL)
```

**Expected:** Should print your R2 public URL
**If undefined:** Server needs restart

### Test 3: Check Generated URLs
```javascript
// Look for console logs in download history page
// Should see:
"Generated public URL: https://pub-xxx.r2.dev/assets/... from storage URL: r2://..."
```

### Test 4: Check Network Tab
```
1. Open DevTools > Network tab
2. Filter by "Img"
3. Reload download history page
4. Check if image requests are made
5. Check status codes (should be 200)
```

---

## 🚨 Common Issues

### Issue 1: Images Still Not Loading After Restart
**Cause:** Browser cache
**Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

### Issue 2: CORS Error in Console
**Cause:** R2 bucket CORS not configured
**Solution:** Add CORS policy to R2 bucket (see Step 4 above)

### Issue 3: 404 Not Found
**Cause:** Files don't exist in R2 or wrong path
**Solution:** 
- Check actual file paths in R2 bucket
- Verify storageUrl in database matches actual files
- Run migration script if needed

### Issue 4: 403 Forbidden
**Cause:** Public access not enabled on R2 bucket
**Solution:** Enable public access in R2 bucket settings

### Issue 5: Environment Variable Undefined
**Cause:** Missing `NEXT_PUBLIC_` prefix or server not restarted
**Solution:** 
- Ensure variable starts with `NEXT_PUBLIC_`
- Restart development server
- Check `.env` file syntax

---

## 📝 Verification Steps

After applying the fix:

1. **Restart server**
   ```bash
   npm run dev
   ```

2. **Clear browser cache**
   - Hard refresh or clear cache

3. **Navigate to download history**
   ```
   /downloads
   ```

4. **Check console for logs**
   - Should see "Generated public URL: ..." messages

5. **Verify images load**
   - Should see actual images instead of fallback icons

6. **Test hover effects**
   - Images should zoom on hover

---

## 🎯 Expected Result

### Before Fix
```
┌─────────────┐
│     📷      │  ← Fallback icon
│    IMAGE    │
└─────────────┘
```

### After Fix
```
┌─────────────┐
│ [Actual     │  ← Real image preview
│  Image      │
│  Preview]   │
└─────────────┘
```

---

## 📞 Still Not Working?

If images still don't load after following all steps:

1. **Check R2 bucket files**
   - Login to Cloudflare Dashboard
   - Go to R2 > Your Bucket
   - Verify files exist

2. **Check database storageUrl values**
   ```sql
   SELECT id, title, storageUrl FROM "Asset" LIMIT 5;
   ```
   - Verify format is `r2://bucket/path/to/file`

3. **Check public URL is correct**
   - Verify `NEXT_PUBLIC_R2_PUBLIC_URL` matches your R2 public domain
   - Test URL directly in browser

4. **Check for JavaScript errors**
   - Open browser console
   - Look for any errors
   - Check Network tab for failed requests

5. **Contact support**
   - Provide console logs
   - Provide Network tab screenshots
   - Provide example storageUrl from database

---

## ✅ Summary

**What was fixed:**
1. ✅ Added `NEXT_PUBLIC_R2_PUBLIC_URL` to `.env`
2. ✅ Updated `getPublicUrl()` function to properly extract R2 keys
3. ✅ Added proper URL format handling
4. ✅ Added console logging for debugging

**What you need to do:**
1. 🔄 Restart development server
2. 🔄 Clear browser cache
3. ✅ Verify images load in download history

The asset previews should now work correctly! 🎉
