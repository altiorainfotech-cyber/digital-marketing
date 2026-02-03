# Asset Viewing Fix - Images and Videos Not Displaying

## Problem

After uploading assets or admin approval, images and videos were not viewable because:

1. **Storage URLs were internal** - Assets stored with `r2://bucket-name/key` format
2. **No public URL conversion** - Frontend tried to display `r2://` URLs directly in `<img>` and `<video>` tags
3. **Missing R2_PUBLIC_URL configuration** - The public URL wasn't being used
4. **CORS not configured** - Production domain wasn't in CORS allowlist

## Solution Implemented

### 1. Updated Configuration (`lib/config.ts`)

Added `r2PublicUrl` to storage config and created a helper function to convert storage URLs to public URLs:

```typescript
export function getPublicUrl(storageUrl: string): string {
  // Converts r2://bucket-name/path to https://public-url/path
}
```

### 2. Created Public URL API Route

**New endpoint:** `GET /api/assets/[id]/public-url`

Returns the public HTTP URL for viewing assets directly.

### 3. Updated Asset Detail Page

Modified `app/assets/[id]/page.tsx` to:
- Fetch public URL when loading images/videos
- Use `publicUrl` state for rendering
- Add error handling for failed loads

### 4. Updated CORS Configuration

Updated `r2-cors-config.json` with production domain:
- `https://digital-marketing-ten-alpha.vercel.app`

## Required Steps

### Step 1: Apply CORS Configuration to R2 Bucket

Run this command with your Cloudflare credentials:

```bash
# Install wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Apply CORS configuration
wrangler r2 bucket cors put digitalmarketing --file r2-cors-config.json
```

Or use the Cloudflare dashboard:
1. Go to R2 → Your bucket (`digitalmarketing`)
2. Settings → CORS Policy
3. Add the configuration from `r2-cors-config.json`

### Step 2: Enable Public Access on R2 Bucket

Your R2 bucket needs to allow public reads:

**Option A: Using Wrangler CLI**
```bash
wrangler r2 bucket update digitalmarketing --public-access
```

**Option B: Using Cloudflare Dashboard**
1. Go to R2 → `digitalmarketing` bucket
2. Settings → Public Access
3. Enable "Allow public access"
4. Note: This makes the bucket publicly readable via the R2.dev domain

### Step 3: Verify R2_PUBLIC_URL

Your `.env` already has:
```
R2_PUBLIC_URL="https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev"
```

Make sure this is also set in Vercel:
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add/verify `R2_PUBLIC_URL` = `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`

### Step 4: Redeploy

After updating environment variables in Vercel:
```bash
git add .
git commit -m "Fix asset viewing - add public URL support"
git push
```

Vercel will automatically redeploy.

## Testing

### Test Image Display
1. Upload an image asset
2. Admin approves it
3. View the asset detail page
4. Image should display in the preview section

### Test Video Playback
1. Upload a video asset
2. Admin approves it
3. View the asset detail page
4. Video player should load and play

### Debug Checklist

If assets still don't display:

1. **Check browser console** for errors
2. **Verify R2 public access** is enabled
3. **Check CORS** - Look for CORS errors in console
4. **Test public URL directly** - Copy the URL from network tab and open in new tab
5. **Verify environment variable** - Check Vercel dashboard for `R2_PUBLIC_URL`

## How It Works

### Upload Flow
1. User uploads file → Gets presigned URL
2. File uploads to R2 with key: `assets/{assetId}/{timestamp}-{filename}`
3. Asset record stores: `r2://digitalmarketing/assets/...`

### Viewing Flow
1. Frontend loads asset details
2. For images/videos, calls `/api/assets/[id]/public-url`
3. API converts `r2://digitalmarketing/assets/xyz/file.jpg` 
   → `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/assets/xyz/file.jpg`
4. Frontend displays using public URL

## Files Modified

- `lib/config.ts` - Added `getPublicUrl()` helper
- `types/index.ts` - Added `r2PublicUrl` to `StorageConfig`
- `app/api/assets/[id]/public-url/route.ts` - New API endpoint
- `app/assets/[id]/page.tsx` - Updated to use public URLs
- `r2-cors-config.json` - Added production domain

## Security Notes

- Public URLs are read-only
- Write operations still require authentication
- Download endpoint still generates signed URLs with expiration
- CORS restricts access to your domains only

## Alternative: Custom Domain (Optional)

For better branding, you can use a custom domain:

1. In Cloudflare R2 settings, add custom domain: `assets.yourdomain.com`
2. Update `R2_PUBLIC_URL` to `https://assets.yourdomain.com`
3. Redeploy

This gives you branded URLs like:
`https://assets.yourdomain.com/assets/xyz/image.jpg`
