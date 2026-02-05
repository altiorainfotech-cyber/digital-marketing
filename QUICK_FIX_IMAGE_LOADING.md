# Quick Fix: Image Loading Error from R2

## The Problem

Images are failing to load with this error:
```
Image failed to load: "https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/..."
```

This means your R2 bucket is not properly configured for public access.

## Root Cause

Your R2 bucket has a public URL (`pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`), but either:
1. The bucket doesn't have public access enabled
2. CORS is not configured correctly
3. The files don't exist at that path

## Solution: Enable Public Access on R2 Bucket

### Step 1: Enable Public Access in Cloudflare Dashboard

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Login to your account

2. **Navigate to R2**
   - Click on "R2" in the left sidebar
   - Find your bucket: `digitalmarketing`

3. **Enable Public Access**
   - Click on your bucket name
   - Go to "Settings" tab
   - Look for "Public Access" or "R2.dev subdomain"
   - Click "Allow Access" or "Enable"
   - You should see a public URL like: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`

4. **Configure CORS (Important!)**
   - In the same Settings tab, scroll to "CORS Policy"
   - Click "Add CORS Policy" or "Edit"
   - Paste this configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://digital-marketing-ten-alpha.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. **Save and Wait**
   - Click "Save"
   - Wait 1-2 minutes for changes to propagate

### Step 2: Verify the Image Exists

Test if the image is accessible by opening this URL directly in your browser:
```
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/cml9epott0014i6oum49iu3wg/1770292948151-Gemini_Generated_Image_gmpomugmpomugmpo.png
```

**Expected Results:**
- ✅ **Image loads**: Public access is working!
- ❌ **404 Error**: File doesn't exist in R2
- ❌ **403 Error**: Public access is not enabled
- ❌ **CORS Error**: CORS is not configured

### Step 3: Check if Files Exist in R2

Run this script to verify files are actually in your R2 bucket:

```bash
npm run tsx scripts/list-r2-files.ts
```

This will show you all files in your R2 bucket and their paths.

## Alternative: Use Signed URLs Instead

If you don't want to enable public access (more secure), you can use signed URLs instead. This requires code changes:

### Option A: Keep Public Access (Simpler)
- Enable public access on R2 bucket
- Configure CORS
- Images load directly from R2

### Option B: Use Signed URLs (More Secure)
- Keep bucket private
- Generate temporary signed URLs for each image
- URLs expire after a set time

## Quick Test

After enabling public access and CORS, test by:

1. **Hard refresh your browser**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Open browser console**: Check for any errors
3. **Try loading the asset page again**

## Troubleshooting

### Still getting 403 errors?
- Double-check public access is enabled
- Verify the R2_PUBLIC_URL in your .env matches the public domain
- Wait a few more minutes for DNS propagation

### CORS errors in console?
- Verify CORS policy includes your domain
- Make sure to include both `http://localhost:3000` and your production URL
- Check that `AllowedMethods` includes `GET` and `HEAD`

### Image still not loading?
- Verify the file actually exists in R2 (use the list-r2-files script)
- Check the storage URL in your database matches the file path in R2
- Try accessing the image URL directly in a new browser tab

## Verify Your Configuration

Your current setup:
- **R2 Account ID**: `9c22162cd4763f9e41394570a2e9c856`
- **R2 Bucket**: `digitalmarketing`
- **Public URL**: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`
- **Production URL**: `https://digital-marketing-ten-alpha.vercel.app`

Make sure these match in your Cloudflare dashboard!

## Next Steps

1. ✅ Enable public access on R2 bucket
2. ✅ Configure CORS policy
3. ✅ Wait 1-2 minutes
4. ✅ Hard refresh browser
5. ✅ Test image loading

Once configured, all images and videos will load properly! 🎉
