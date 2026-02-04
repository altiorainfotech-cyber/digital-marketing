# Asset Preview Fix Guide

## Problem
Admin users cannot see images and videos of pending assets before approving them. The error shows:
```
Video failed to load: "stream:///cml6j3yn40000ntou6entofg9"
```

## Root Cause
The issue occurs because:
1. Assets are stored in Cloudflare R2 with private URLs (format: `r2://bucket/key`)
2. To display them in the browser, they need to be converted to public HTTP URLs
3. This requires the R2 bucket to have:
   - **Public access enabled** via a custom domain or R2.dev subdomain
   - **CORS configured** to allow browser requests
   - **R2_PUBLIC_URL environment variable** set correctly

## Solution Steps

### Step 1: Verify R2 Public Access is Enabled

1. Go to Cloudflare Dashboard → R2 → Your bucket (`digitalmarketing`)
2. Click on **Settings** tab
3. Under **Public Access**, click **Connect Domain** or **Allow Access**
4. You should see your public URL: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`

### Step 2: Apply CORS Configuration

Run this command to apply CORS settings to your R2 bucket:

```bash
# Using Wrangler CLI
npx wrangler r2 bucket cors put digitalmarketing --file r2-cors-config.json
```

Or manually in Cloudflare Dashboard:
1. Go to R2 → Your bucket → Settings → CORS Policy
2. Add the CORS rules from `r2-cors-config.json`

### Step 3: Verify Environment Variables

Check that your `.env` file has:
```env
R2_PUBLIC_URL="https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev"
```

**Important for Vercel Deployment:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `R2_PUBLIC_URL` with value: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`
3. Redeploy your application

### Step 4: Test the Fix

1. Upload a new test image or video
2. As admin, go to Pending Approvals
3. Click on the asset to view details
4. The preview should now load correctly

### Step 5: Debug if Still Not Working

If previews still don't work, check browser console for errors:

**Common Issues:**

1. **CORS Error**: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
   - Solution: Reapply CORS configuration, ensure your domain is in AllowedOrigins

2. **404 Error**: "Failed to load resource: the server responded with a status of 404"
   - Solution: Check that R2_PUBLIC_URL is correct and public access is enabled

3. **Empty publicUrl**: "Public URL is empty - check R2_PUBLIC_URL environment variable"
   - Solution: Set R2_PUBLIC_URL in environment variables and restart server

4. **Wrong URL format**: URL shows `stream://` or `images://` instead of `r2://`
   - Solution: Check that StorageService is using R2 for all file types (already configured)

## Code Changes Made

### 1. Enhanced Error Logging (`app/assets/[id]/page.tsx`)
- Added console logging to track public URL fetching
- Added warning when R2_PUBLIC_URL is not configured
- Improved error messages in preview section

### 2. Better Error Display
- Shows helpful error messages when images/videos fail to load
- Displays warning icon and troubleshooting hints
- Distinguishes between "not configured" vs "failed to load"

## Testing Checklist

- [ ] R2 bucket has public access enabled
- [ ] CORS configuration is applied to R2 bucket
- [ ] R2_PUBLIC_URL is set in local `.env` file
- [ ] R2_PUBLIC_URL is set in Vercel environment variables
- [ ] Application is redeployed after environment variable changes
- [ ] Can upload new assets successfully
- [ ] Can view image previews in asset detail page
- [ ] Can view video previews in asset detail page
- [ ] No CORS errors in browser console
- [ ] No 404 errors when loading media files

## Quick Verification Commands

```bash
# Check if R2_PUBLIC_URL is set locally
echo $R2_PUBLIC_URL

# Test if R2 public URL is accessible
curl -I https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev

# Check CORS configuration
npx wrangler r2 bucket cors get digitalmarketing
```

## Additional Notes

- All files (images, videos, documents) are stored in R2, not Cloudflare Stream or Images
- The `getPublicUrl()` function in `lib/config.ts` converts `r2://` URLs to public HTTP URLs
- Public URLs are only generated for IMAGE and VIDEO asset types
- DOCUMENT assets use signed download URLs instead of public previews
- LINK assets don't require storage and display the link directly

## Support

If you continue to experience issues:
1. Check browser console for specific error messages
2. Verify R2 bucket settings in Cloudflare Dashboard
3. Ensure environment variables are set in both local and production
4. Try uploading a new test asset after applying all fixes
