# Solution: Assets Not Viewable After Upload/Approval

## Problem Summary

**Issue:** Images and videos are not displaying after upload or admin approval. Video player shows blank, images don't load.

**Root Cause:** 
1. Assets stored with internal `r2://` URLs
2. Frontend trying to display `r2://` URLs directly (browsers don't understand this protocol)
3. R2 bucket not configured for public access
4. Missing URL conversion from storage format to public HTTP URLs

## Solution Implemented ✅

### Code Changes

1. **Added Public URL Conversion** (`lib/config.ts`)
   - Created `getPublicUrl()` function to convert `r2://` → `https://`
   - Uses `R2_PUBLIC_URL` environment variable

2. **New API Endpoint** (`app/api/assets/[id]/public-url/route.ts`)
   - Returns public HTTP URL for any asset
   - Handles URL conversion server-side

3. **Updated Asset Detail Page** (`app/assets/[id]/page.tsx`)
   - Fetches public URL when loading images/videos
   - Uses public URL in `<img>` and `<video>` tags
   - Added error handling for failed loads

4. **Updated Asset List** (`lib/services/AssetService.ts`)
   - Adds `thumbnailUrl` field to asset responses
   - Automatically converts image URLs for thumbnails

5. **Updated CORS Config** (`r2-cors-config.json`)
   - Added production domain: `https://digital-marketing-ten-alpha.vercel.app`

## Required Configuration Steps

### ⚠️ CRITICAL: You Must Complete These Steps

#### Step 1: Enable R2 Public Access

**Via Cloudflare Dashboard:**
1. Go to https://dash.cloudflare.com
2. Navigate to **R2** → **digitalmarketing** bucket
3. Click **Settings** tab
4. Find **Public Access** section
5. Click **Allow Access** button
6. Confirm the action

**Why:** This allows browsers to fetch files directly from R2 using the public URL.

#### Step 2: Apply CORS Configuration

**Via Cloudflare Dashboard:**
1. In the same bucket settings
2. Find **CORS Policy** section
3. Click **Edit CORS Policy**
4. Paste this configuration:

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

5. Save

**OR Via Wrangler CLI:**
```bash
npm install -g wrangler
wrangler login
wrangler r2 bucket cors put digitalmarketing --file r2-cors-config.json
```

**Why:** CORS allows your website to access files from the R2 domain.

#### Step 3: Verify Vercel Environment Variable

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify `R2_PUBLIC_URL` exists with value:
   ```
   https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev
   ```
5. If missing, add it for all environments (Production, Preview, Development)
6. **Redeploy** your application

**Why:** The code needs this URL to convert storage URLs to public URLs.

#### Step 4: Deploy Changes

```bash
git push
```

Vercel will automatically deploy the changes.

## Testing

### Test Image Display
1. Upload a new image
2. If SEO type, admin approves it
3. Go to asset detail page
4. **Expected:** Image displays in preview section

### Test Video Playback
1. Upload a new video
2. If SEO type, admin approves it
3. Go to asset detail page
4. **Expected:** Video player loads and plays

### Test Asset List
1. Go to `/assets` page
2. **Expected:** Image thumbnails display in grid view

## Verification Checklist

- [ ] R2 bucket has public access enabled
- [ ] CORS policy is applied to R2 bucket
- [ ] `R2_PUBLIC_URL` environment variable is set in Vercel
- [ ] Application has been redeployed
- [ ] New uploads display correctly
- [ ] Existing assets display correctly
- [ ] No CORS errors in browser console
- [ ] No 403 errors in browser console

## How to Verify Each Step

### Verify Public Access
1. Open browser
2. Navigate to: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/`
3. **Expected:** Should NOT show "Access Denied"

### Verify CORS
1. Upload an asset
2. View asset detail page
3. Open browser console (F12)
4. **Expected:** No CORS errors

### Verify Environment Variable
```bash
# In your terminal
vercel env ls

# Should show R2_PUBLIC_URL
```

## Troubleshooting

### Images Still Not Showing?

**Check 1: Browser Console**
- Press F12
- Go to Console tab
- Look for errors

**Common Errors:**
- `CORS policy` → CORS not configured
- `403 Forbidden` → Public access not enabled
- `404 Not Found` → File doesn't exist in R2

**Check 2: Network Tab**
- Press F12
- Go to Network tab
- Reload page
- Look for failed requests to R2
- Click on failed request to see details

**Check 3: Test Direct URL**
1. Find an asset's storage URL in database
2. Convert manually: `r2://digitalmarketing/assets/xyz/file.jpg` 
   → `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/xyz/file.jpg`
3. Open in browser
4. If it fails, R2 configuration is wrong

### Videos Not Playing?

**Check 1: Video Format**
- R2 supports all video formats
- Browser might not support the codec
- Try MP4 with H.264 codec (most compatible)

**Check 2: File Size**
- Large videos might take time to load
- Check network tab for progress

**Check 3: CORS**
- Video requires CORS for streaming
- Verify CORS is applied

## What Happens Now

### Upload Flow
```
User uploads → File goes to R2 → Stored as r2://... → 
Backend converts to https://... → Frontend displays
```

### Viewing Flow
```
User views asset → Frontend fetches public URL → 
Browser loads from https://pub-...r2.dev → 
Image/video displays ✅
```

## Security Notes

✅ **Public URLs are read-only**
- Anyone with the URL can view the file
- This is normal for marketing assets
- No one can upload or delete via public URL

✅ **Write operations still require authentication**
- Upload requires login
- Approve/reject requires admin role
- Delete requires proper permissions

✅ **Download tracking still works**
- Download endpoint generates signed URLs
- Logs who downloaded what
- Tracks platform intent

## Files Modified

```
lib/config.ts                              - Added getPublicUrl()
lib/services/AssetService.ts               - Added thumbnailUrl
lib/utils/urlUtils.ts                      - URL utility functions
types/index.ts                             - Updated StorageConfig
app/api/assets/[id]/public-url/route.ts    - New endpoint
app/assets/[id]/page.tsx                   - Uses public URLs
r2-cors-config.json                        - Updated domains
```

## Next Steps

1. ✅ Complete Step 1: Enable R2 public access
2. ✅ Complete Step 2: Apply CORS configuration
3. ✅ Complete Step 3: Verify environment variable
4. ✅ Complete Step 4: Deploy changes
5. 🧪 Test with new uploads
6. 🧪 Verify existing assets display
7. 🎉 Done!

## Need Help?

If assets still don't display after completing all steps:

1. Check all items in "Verification Checklist"
2. Review "Troubleshooting" section
3. Check browser console for specific errors
4. Test direct R2 URL in browser
5. Verify R2 bucket settings in Cloudflare dashboard

## Documentation

- Full details: `ASSET_VIEWING_FIX.md`
- Quick reference: `QUICK_FIX_ASSETS_NOT_SHOWING.md`
- Flow diagram: `ASSET_FLOW_DIAGRAM.md`
