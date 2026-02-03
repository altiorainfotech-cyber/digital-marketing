# Quick Fix: Assets Not Showing (Images/Videos)

## The Problem
After uploading or approving assets, images and videos don't display because the R2 bucket needs public access enabled.

## Quick Solution (3 Steps)

### Step 1: Enable Public Access on R2 Bucket

Go to Cloudflare Dashboard:
1. Navigate to **R2** → **digitalmarketing** bucket
2. Click **Settings** tab
3. Find **Public Access** section
4. Click **Allow Access** or **Enable Public Access**
5. Confirm the action

This makes your bucket publicly readable via the R2.dev URL.

### Step 2: Apply CORS Configuration

**Option A: Using Cloudflare Dashboard**
1. In the same bucket settings, find **CORS Policy**
2. Click **Edit CORS Policy**
3. Add this configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://digital-marketing-ten-alpha.vercel.app"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**Option B: Using Wrangler CLI**
```bash
# Install wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Apply CORS from the config file
wrangler r2 bucket cors put digitalmarketing --file r2-cors-config.json
```

### Step 3: Verify Environment Variable in Vercel

1. Go to **Vercel Dashboard** → Your Project
2. **Settings** → **Environment Variables**
3. Verify `R2_PUBLIC_URL` exists with value:
   ```
   https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev
   ```
4. If missing, add it
5. **Redeploy** your application

## Test It

1. Upload a new image or video
2. Admin approves it (if SEO type)
3. View the asset detail page
4. Image/video should now display

## Troubleshooting

### Still not working?

**Check 1: Public Access**
- Go to R2 bucket settings
- Verify "Public Access" shows as "Enabled"

**Check 2: Test Direct URL**
Open this in your browser:
```
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/[some-asset-id]/[filename]
```
If you get "Access Denied", public access isn't enabled.

**Check 3: Browser Console**
- Open asset detail page
- Press F12 → Console tab
- Look for CORS errors or 403 errors
- If you see CORS errors, CORS configuration needs to be applied

**Check 4: Environment Variable**
In your terminal:
```bash
# Check Vercel env vars
vercel env ls

# Should show R2_PUBLIC_URL
```

## What Changed

The code now:
1. Converts `r2://bucket/path` → `https://public-url/path`
2. Uses public URLs for displaying images/videos
3. Adds `thumbnailUrl` to asset list responses
4. Handles errors gracefully if assets fail to load

## Files Modified

- `lib/config.ts` - Added `getPublicUrl()` helper
- `lib/services/AssetService.ts` - Added `thumbnailUrl` to responses
- `app/assets/[id]/page.tsx` - Uses public URLs for display
- `app/api/assets/[id]/public-url/route.ts` - New API endpoint
- `r2-cors-config.json` - Updated with production domain

## Security Note

Public access means anyone with the URL can view the files. This is normal for:
- Marketing assets (images, videos for social media)
- Public-facing content

If you need private assets:
- Use the download endpoint (generates signed URLs with expiration)
- Don't share the direct R2 URLs
