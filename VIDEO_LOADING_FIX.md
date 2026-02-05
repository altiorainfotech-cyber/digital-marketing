# Video Loading Issue - Fix Guide

## Problem
Videos are failing to load with the error:
```
Video failed to load: https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/videos/cml96cni70000i6ouw6r79uhx
```

## Root Cause Analysis

✅ **URL conversion is working** - The `r2://` URL is correctly converted to public HTTPS URL
✅ **API is working** - The `/api/assets/[id]/public-url` endpoint returns the correct URL
✅ **CORS is configured** - The R2 CORS config includes necessary headers

❌ **Possible issues**:
1. Video file doesn't exist in R2 bucket
2. R2 bucket public access is not enabled
3. Video file is corrupted or incomplete

## Solution Steps

### Step 1: Verify R2 Bucket Public Access

Your R2 bucket needs to be publicly accessible for videos to load.

1. Go to Cloudflare Dashboard
2. Navigate to R2 > Your Bucket (`digitalmarketing`)
3. Go to Settings > Public Access
4. **Enable "Allow Access"**
5. Note the public URL (should be: `https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev`)

### Step 2: Test Video URL Directly

Open this URL in your browser:
```
https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/videos/cml96cni70000i6ouw6r79uhx
```

**Expected results:**
- ✅ Video downloads or plays → R2 is configured correctly
- ❌ 404 Not Found → Video file doesn't exist in R2
- ❌ 403 Forbidden → Public access not enabled
- ❌ CORS error → CORS not configured

### Step 3: Check if Video File Exists in R2

Run this command to list files in R2:

```bash
npx wrangler r2 object list digitalmarketing --prefix videos/
```

Look for: `videos/cml96cni70000i6ouw6r79uhx`

### Step 4: Re-upload the Video (if missing)

If the video file doesn't exist in R2, you need to re-upload it:

1. Go to `/assets/upload`
2. Upload the video file again
3. The system will store it in R2 with a new ID

### Step 5: Update R2 CORS (if needed)

Apply the CORS configuration:

```bash
npx wrangler r2 bucket cors put digitalmarketing --file r2-cors-config.json
```

Verify CORS:

```bash
npx wrangler r2 bucket cors get digitalmarketing
```

## Quick Fix: Enable Public Access

If you just need to enable public access quickly:

```bash
# Using wrangler CLI
npx wrangler r2 bucket domain add digitalmarketing --domain pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev
```

Or via Cloudflare Dashboard:
1. R2 > digitalmarketing bucket
2. Settings > Public Access
3. Click "Allow Access"
4. Copy the public URL
5. Update `.env` with `R2_PUBLIC_URL=<your-public-url>`

## Testing After Fix

1. **Test URL directly in browser**:
   ```
   https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/videos/cml96cni70000i6ouw6r79uhx
   ```

2. **Test with curl**:
   ```bash
   curl -I https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/videos/cml96cni70000i6ouw6r79uhx
   ```
   
   Should return `200 OK` with video content-type

3. **Test in app**:
   - Navigate to the asset detail page
   - Video should load and play

## Alternative: Use Cloudflare Stream

For better video performance, consider using Cloudflare Stream instead of R2:

1. Enable Stream in Cloudflare Dashboard
2. Update `.env` with Stream credentials:
   ```
   STREAM_ACCOUNT_ID=your-account-id
   STREAM_API_TOKEN=your-api-token
   ```
3. Videos will be automatically transcoded and optimized

## Common Issues & Solutions

### Issue: 403 Forbidden
**Solution**: Enable public access on R2 bucket

### Issue: 404 Not Found
**Solution**: Video file doesn't exist, re-upload it

### Issue: CORS Error
**Solution**: Apply CORS configuration with wrangler

### Issue: Video plays but slowly
**Solution**: Consider using Cloudflare Stream for better performance

### Issue: Some videos work, others don't
**Solution**: Check if all video files were uploaded successfully

## Verification Checklist

- [ ] R2 bucket public access is enabled
- [ ] R2_PUBLIC_URL is set in `.env`
- [ ] CORS is configured on R2 bucket
- [ ] Video file exists in R2 (check with wrangler)
- [ ] Public URL works when opened directly in browser
- [ ] Video loads in the app

## Environment Variables

Make sure these are set in `.env`:

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=digitalmarketing
R2_PUBLIC_URL=https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev
```

## Debug Commands

```bash
# List all videos in R2
npx wrangler r2 object list digitalmarketing --prefix videos/

# Check specific video
npx wrangler r2 object get digitalmarketing videos/cml96cni70000i6ouw6r79uhx

# Test public URL
curl -I https://pub-712c102a5f654fa5b5f30a2dd821a83d.r2.dev/videos/cml96cni70000i6ouw6r79uhx

# Check CORS
npx wrangler r2 bucket cors get digitalmarketing
```

## Next Steps

1. **Immediate**: Enable public access on R2 bucket
2. **Short-term**: Verify all uploaded videos exist in R2
3. **Long-term**: Consider migrating to Cloudflare Stream for better video delivery

---

**Note**: This is NOT related to the company folders feature. The company folders are working correctly. This is a separate R2 configuration issue.
